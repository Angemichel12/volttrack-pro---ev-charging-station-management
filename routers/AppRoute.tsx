import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { Layout } from "../components/Layout";

import { Login } from "../pages/Login";
import { AdminDashboard } from "../pages/DashboardPages";
import { StaffShiftPage } from "../pages/StaffShift";
import { StaffSessionsPage } from "../pages/StaffSessions";
import { AdminStations, AdminEmployees, AdminChargers } from "../pages/AdminManagement";
import { AdminReports } from "@/pages/AdminReports";
import { CarManagement } from "../pages/CarManagement";
import { ExpensesPage } from "../pages/ExpensesPage";
import { StaffHistory } from "../pages/StaffHistory";
import { StaffReports } from "@/pages/StaffReports";

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={["admin"]}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

const StaffLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={["staff"]}>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

export const AppRouter: React.FC = () => (
  <Routes>
    {/* ── Public ───────────────────────────────────────────── */}
    <Route path="/" element={<Login />} />

    {/* ── Admin ────────────────────────────────────────────── */}
    <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
    <Route path="/admin/stations"  element={<AdminLayout><AdminStations /></AdminLayout>} />
    <Route path="/admin/employees" element={<AdminLayout><AdminEmployees /></AdminLayout>} />
    <Route path="/admin/cars"      element={<AdminLayout><CarManagement /></AdminLayout>} />
    <Route path="/admin/chargers"  element={<AdminLayout><AdminChargers /></AdminLayout>} />
    <Route path="/admin/expenses"  element={<AdminLayout><ExpensesPage /></AdminLayout>} />
    <Route path="/admin/reports"   element={<AdminLayout><AdminReports /></AdminLayout>} />
    <Route path="/admin/reports/export" element={<Navigate to="/admin/reports" replace />} />

    {/* ── Staff ────────────────────────────────────────────── */}
    <Route path="/staff/shift"     element={<StaffLayout><StaffShiftPage /></StaffLayout>} />
    <Route path="/staff/sessions"  element={<StaffLayout><StaffSessionsPage /></StaffLayout>} />
    <Route path="/staff/dashboard" element={<Navigate to="/staff/shift" replace />} />
    <Route path="/staff/cars"      element={<StaffLayout><CarManagement /></StaffLayout>} />
    <Route path="/staff/history"   element={<StaffLayout><StaffHistory /></StaffLayout>} />
    <Route path="/staff/reports"   element={<StaffLayout><StaffReports /></StaffLayout>} />
    <Route path="/staff/reports/export" element={<Navigate to="/staff/reports" replace />} />

    {/* ── Fallback ─────────────────────────────────────────── */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
