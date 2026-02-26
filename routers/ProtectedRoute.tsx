import React from "react";
import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactNode;
  allowedRoles: ("admin" | "staff")[];
}

export const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const userRaw = localStorage.getItem("user");
  const token = localStorage.getItem("access");

  // Not logged in
  if (!token || !userRaw) {
    return <Navigate to="/" replace />;
  }

  const user = JSON.parse(userRaw);

  // Wrong role — redirect to their own dashboard
  if (!allowedRoles.includes(user.role)) {
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "staff") return <Navigate to="/staff/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};