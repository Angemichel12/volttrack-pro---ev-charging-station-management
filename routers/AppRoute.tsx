import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { Layout } from "../components/Layout";

import { Login } from "../pages/Login";
import { AdminDashboard, StaffDashboard } from "../pages/DashboardPages";
import { AdminStations, AdminEmployees, AdminChargers } from "../pages/AdminManagement";
import { AdminReports } from "@/pages/AdminReports";
import { CarManagement } from "../pages/CarManagement";
import { AdminDetailedReports, StaffDetailedReports } from "../pages/DetailedReports";
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
    <Route path="/admin/reports"   element={<AdminLayout><AdminReports /></AdminLayout>} />
    <Route path="/admin/reports/export" element={<AdminLayout><AdminDetailedReports /></AdminLayout>} />

    {/* ── Staff ────────────────────────────────────────────── */}
    <Route path="/staff/dashboard" element={<StaffLayout><StaffDashboard /></StaffLayout>} />
    <Route path="/staff/cars"      element={<StaffLayout><CarManagement /></StaffLayout>} />
    <Route path="/staff/history"   element={<StaffLayout><StaffHistory /></StaffLayout>} />
    <Route path="/staff/reports"   element={<StaffLayout><StaffReports /></StaffLayout>} />
    <Route path="/staff/reports/export" element={<StaffLayout><StaffDetailedReports /></StaffLayout>} />

    {/* ── Fallback ─────────────────────────────────────────── */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);