import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { successToast, errorToast } from "@/utils/toast";
import api from "@/utils/axios";
import { useAuth } from "@/context/AuthContext";

interface LoginPayload {
  phone_number: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
    phone_number: string;
    role: "admin" | "staff";
    station: number | null;
    access: string;
    refresh: string;
  };
}

export const useLogin = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const login = async (payload: LoginPayload) => {
    setLoading(true);
    try {
      const response = await api.post<LoginResponse>("api/auth/login/", payload);
      const { data } = response.data;

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      // Update the auth context too (it also persists to localStorage) —
      // Layout renders nothing until the context knows who is logged in.
      setUser({
        id: data.id,
        name: data.name,
        phone_number: data.phone_number,
        role: data.role,
        station: data.station,
      });

      successToast(`Welcome back, ${data.name}!`);

      if (data.role === "admin") navigate("/admin/dashboard");
      else if (data.role === "staff") navigate("/staff/shift");

    } catch (error: any) {
      errorToast(error?.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return { login, loading };
};