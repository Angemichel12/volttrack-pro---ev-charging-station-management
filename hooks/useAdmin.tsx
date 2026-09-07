import { useState, useEffect, useCallback } from "react";
import { successToast, errorToast } from "@/utils/toast";
import api from "@/utils/axios";
import { safeArray } from "@/utils/safeArray";
import { unwrapPage, emptyPageMeta, type PageMeta } from "@/utils/pagination";

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
  phone_number: string;
  role: "staff";
  is_active: boolean;
  created_at: string;
}

export interface EmployeePayload {
  name: string;
  phone_number: string;
  password: string;
  role: "staff";
}

export type PortSide = "left" | "right";

export interface ChargerPort {
  port: PortSide;
  available: boolean;
}

export interface Charger {
  id: number;
  name: string;
  station: number;
  station_name: string;
  ports: ChargerPort[];
}

export interface ChargerPayload {
  name: string;
  station: number;
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
      setStations(unwrapPage<Station>(res.data?.data).results);
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
  const [meta, setMeta] = useState<PageMeta>(emptyPageMeta);

  const fetchEmployees = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const res = await api.get("api/admin/users/", { params: { role: "staff", page } });
      const pg = unwrapPage<Employee>(res.data?.data);
      setEmployees(pg.results);
      setMeta(pg);
    } catch {
      errorToast("Failed to load employees");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmployees(1); }, [fetchEmployees]);

  const createEmployee = async (payload: EmployeePayload) => {
    try {
      const res = await api.post("api/admin/users/", payload);
      setEmployees(prev => [...prev, res.data.data]);
      setMeta(m => ({ ...m, count: m.count + 1 }));
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
      setMeta(m => ({ ...m, count: Math.max(0, m.count - 1) }));
      successToast("Employee deleted");
    } catch {
      errorToast("Failed to delete employee");
    }
  };

  return {
    employees,
    loading,
    page: meta.page,
    totalPages: meta.total_pages,
    count: meta.count,
    changePage: fetchEmployees,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  };
};

// ─── useAdminChargers ─────────────────────────────────────────────────────────

export const useAdminChargers = () => {
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<PageMeta>(emptyPageMeta);

  const fetchChargers = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const res = await api.get("api/chargers/", { params: { page } });
      const pg = unwrapPage<Charger>(res.data?.data);
      setChargers(pg.results);
      setMeta(pg);
    } catch {
      errorToast("Failed to load chargers");
      setChargers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChargers(1); }, [fetchChargers]);

  const createCharger = async (payload: ChargerPayload): Promise<boolean> => {
    try {
      const res = await api.post("api/chargers/", payload);
      setChargers(prev => [...prev, res.data.data]);
      setMeta(m => ({ ...m, count: m.count + 1 }));
      successToast("Charger created");
      return true;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to create charger");
      return false;
    }
  };

  const deleteCharger = async (id: number): Promise<void> => {
    try {
      await api.delete(`api/chargers/${id}/`);
      setChargers(prev => prev.filter(c => c.id !== id));
      setMeta(m => ({ ...m, count: Math.max(0, m.count - 1) }));
      successToast("Charger deleted");
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to delete charger");
    }
  };

  return {
    chargers,
    loading,
    page: meta.page,
    totalPages: meta.total_pages,
    count: meta.count,
    changePage: fetchChargers,
    fetchChargers,
    createCharger,
    deleteCharger,
  };
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