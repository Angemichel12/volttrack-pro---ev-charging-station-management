import axios from "axios";
import type {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { errorToast } from "./toast";

// Create an Axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/",
  timeout: 100000,
  headers: {
    "Content-Type": "application/json",
    accept: "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Add token to headers if available
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Auth failure handling ────────────────────────────────────────────────────
// On 401: try to refresh the access token once (SimpleJWT rotates the refresh
// token too), then retry the failed request. If refresh isn't possible, clear
// the session and send the user back to the login page.

const AUTH_PATHS = ["api/auth/login/", "api/auth/register/", "api/auth/refresh/"];

const clearSessionAndRedirect = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
  // Only announce/redirect once — concurrent 401s all land here.
  if (window.location.pathname !== "/") {
    errorToast("Your session has expired. Please sign in again.");
    window.location.href = "/";
  }
};

// Single-flight refresh: concurrent 401s share one refresh request.
let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = (): Promise<string | null> => {
  if (!refreshPromise) {
    const refresh = localStorage.getItem("refresh");
    refreshPromise = (async () => {
      if (!refresh) return null;
      try {
        // Plain axios (not `api`) so this call skips the interceptors.
        const res = await axios.post(
          `${api.defaults.baseURL}api/auth/refresh/`,
          { refresh },
          { headers: { "Content-Type": "application/json" } }
        );
        const data = res.data?.data ?? res.data;
        if (!data?.access) return null;
        localStorage.setItem("access", data.access);
        if (data.refresh) localStorage.setItem("refresh", data.refresh);
        return data.access as string;
      } catch {
        return null;
      } finally {
        // Allow a future refresh after this one settles.
        setTimeout(() => { refreshPromise = null; }, 0);
      }
    })();
  }
  return refreshPromise;
};

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error) => {
    const status = error.response?.status;
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthCall = AUTH_PATHS.some(p => original?.url?.includes(p));

    // Auth failure on a normal API call — not a wrong-password on login itself.
    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      const newAccess = await refreshAccessToken();
      if (newAccess) {
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original); // retry the original request with the fresh token
      }
      clearSessionAndRedirect();
    }

    return Promise.reject(error);
  }
);

export default api;
