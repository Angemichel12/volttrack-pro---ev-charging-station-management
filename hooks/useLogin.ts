import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { successToast, errorToast } from "@/utils/toast";
import api from "@/utils/axios";

interface LoginPayload {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
    email: string;
    role: "admin" | "staff";
    station: number | null;
    access: string;
    refresh: string;
  };
}

export const useLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const login = async (payload: LoginPayload) => {
    setLoading(true);
    try {
      const response = await api.post<LoginResponse>("api/auth/login/", payload);
      const { data } = response.data;

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("user", JSON.stringify({
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        station: data.station,
      }));

      successToast(`Welcome back, ${data.name}!`);

      if (data.role === "admin") navigate("/admin/dashboard");
      else if (data.role === "staff") navigate("/staff/dashboard");

    } catch (error: any) {
      errorToast(error?.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return { login, loading };
};