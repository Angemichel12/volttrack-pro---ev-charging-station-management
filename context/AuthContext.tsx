import React, { createContext, useContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { successToast, errorToast } from "@/utils/toast";
import api from "@/utils/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  name: string;
  phone_number: string;
  role: "admin" | "staff";   // manager removed
  station: number | null;    // staff are assigned to a station, admin is null
}

interface AuthContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
  isAdmin: boolean;
  isStaff: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const navigate = useNavigate();

  const setUser = (user: AuthUser | null) => {
    setUserState(user);
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  };

  const logout = async () => {
    try {
      await api.post("api/auth/logout/", { refresh: localStorage.getItem("refresh") });
    } catch (e: any) {
      // Staff can't log out with an open shift — the backend blocks it (400).
      // Keep the session and send them to the shift page to close it first.
      if (e?.response?.status === 400) {
        errorToast(e?.response?.data?.message || "End your shift before logging out.");
        if (user?.role === "staff") navigate("/staff/shift");
        return;
      }
      // Any other error (expired token etc.) — clear locally regardless.
    }
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
    setUserState(null);
    successToast("Logged out successfully");
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      logout,
      isAdmin: user?.role === "admin",
      isStaff: user?.role === "staff",
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};