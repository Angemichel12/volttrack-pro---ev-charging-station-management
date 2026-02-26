import { useState, useEffect, useCallback } from "react";
import { successToast, errorToast } from "@/utils/toast";
import api from "@/utils/axios";
import { safeArray } from "@/utils/safeArray";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Station {
  id: number;
  name: string;
  price_per_watt: string | null;
  created_at: string;
}

export interface StationPayload {
  name: string;
  price_per_watt?: string | null;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  role: "staff";
  station: number | null;
  is_active: boolean;
  created_at: string;
}

export interface EmployeePayload {
  name: string;
  email: string;
  password: string;
  role: "staff";
  station?: number | null;
}

export interface AdminReport {
  summary: {
    total_earnings: string | null;
    total_watt: string | null;
    total_sessions: number | null;
  };
  per_station: {
    station__id: number;
    station__name: string;
    sessions: number;
    earnings: string;
    watt_used: string;
  }[];
}

// ─── useAdminStations ─────────────────────────────────────────────────────────

export const useAdminStations = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("api/stations/");
      setStations(safeArray<Station>(res.data.data));
    } catch {
      errorToast("Failed to load stations");
      setStations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStations(); }, [fetchStations]);

  const createStation = async (payload: StationPayload) => {
    try {
      const res = await api.post("api/stations/", payload);
      setStations(prev => [...prev, res.data.data]);
      successToast("Station created");
      return true;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to create station");
      return false;
    }
  };

  const updateStation = async (id: number, payload: Partial<StationPayload>) => {
    try {
      const res = await api.patch(`api/stations/${id}/`, payload);
      setStations(prev => prev.map(s => s.id === id ? res.data.data : s));
      successToast("Station updated");
      return true;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to update station");
      return false;
    }
  };

  const deleteStation = async (id: number) => {
    try {
      await api.delete(`api/stations/${id}/`);
      setStations(prev => prev.filter(s => s.id !== id));
      successToast("Station deleted");
    } catch {
      errorToast("Failed to delete station");
    }
  };

  const setPrice = async (id: number, price: string) => {
    try {
      const res = await api.post(`api/stations/${id}/set-price/`, { price_per_watt: price });
      setStations(prev => prev.map(s => s.id === id ? res.data.data : s));
      successToast("Price updated");
      return true;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to set price");
      return false;
    }
  };

  return { stations, loading, fetchStations, createStation, updateStation, deleteStation, setPrice };
};

// ─── useAdminEmployees ────────────────────────────────────────────────────────

export const useAdminEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("api/admin/users/?role=staff");
      setEmployees(safeArray<Employee>(res.data.data));
    } catch {
      errorToast("Failed to load employees");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const createEmployee = async (payload: EmployeePayload) => {
    try {
      const res = await api.post("api/admin/users/", payload);
      setEmployees(prev => [...prev, res.data.data]);
      successToast("Employee created");
      return true;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to create employee");
      return false;
    }
  };

  const updateEmployee = async (id: number, payload: Partial<EmployeePayload>) => {
    try {
      const res = await api.patch(`api/admin/users/${id}/`, payload);
      setEmployees(prev => prev.map(e => e.id === id ? res.data.data : e));
      successToast("Employee updated");
      return true;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to update employee");
      return false;
    }
  };

  const deleteEmployee = async (id: number) => {
    try {
      await api.delete(`api/admin/users/${id}/`);
      setEmployees(prev => prev.filter(e => e.id !== id));
      successToast("Employee deleted");
    } catch {
      errorToast("Failed to delete employee");
    }
  };

  return { employees, loading, fetchEmployees, createEmployee, updateEmployee, deleteEmployee };
};

// ─── useAdminReports ──────────────────────────────────────────────────────────

export const useAdminReports = () => {
  const [reports, setReports] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await api.get("api/stations/reports/");
        // Normalize: ensure per_station is always an array
        const data = res.data.data;
        setReports(data ? {
          ...data,
          per_station: safeArray(data.per_station),
        } : null);
      } catch {
        errorToast("Failed to load reports");
        setReports(null);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  return { reports, loading };
};