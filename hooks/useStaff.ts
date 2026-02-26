import { useState, useEffect, useCallback } from "react";
import { successToast, errorToast } from "@/utils/toast";
import api from "@/utils/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StationCharger {
  id: number;
  name: string;
  station: number;
  station_name: string;
}

export interface Car {
  id: number;
  plate_number: string;
  optional_info: string | null;
  created_at: string;
}

export interface Session {
  id: number;
  station: number;
  station_name: string;
  charger: number;
  charger_name: string;
  staff: number;
  car: number;
  car_plate: string;
  watt_consumed: string | null;
  total_price: string | null;
  started_at: string;
  ended_at: string | null;
}

export interface ShiftRecord {
  id: number;
  station: number;
  station_name: string;
  staff: number;
  staff_name: string;
  shift_start: string;
  shift_end: string | null;
  kwh_start: string;
  kwh_end: string | null;
  kwh_consumed: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface StaffDashboard {
  station: {
    id: number;
    name: string;
    price_per_watt: string | null;
  };
  charger_count: number;
  open_shift: ShiftRecord | null;
  total_sessions: number | null;
  total_earnings: string | null;
  total_watt: string | null;
}

export interface StaffReport {
  summary: {
    total_earnings: string | null;
    total_watt: string | null;
    total_sessions: number | null;
  };
  charger_usage: {
    charger__id: number;
    charger__name: string;
    sessions: number;
    earnings: string;
  }[];
  shift_history: {
    staff__id: number;
    staff__name: string;
    shift_start: string;
    shift_end: string | null;
    kwh_start: string;
    kwh_end: string | null;
    kwh_consumed: string | null;
  }[];
}

// ─── useStaffDashboard ────────────────────────────────────────────────────────

export const useStaffDashboard = () => {
  const [data, setData] = useState<StaffDashboard | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("api/stations/dashboard/");
      setData(res.data.data);
    } catch {
      errorToast("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, refresh: fetch };
};

// ─── useStationChargers ───────────────────────────────────────────────────────

export const useStationChargers = () => {
  const [chargers, setChargers] = useState<StationCharger[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchChargers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("api/stations/chargers/");
      const raw = res.data?.data ?? res.data;
      setChargers(Array.isArray(raw) ? raw : []);
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to load chargers");
      setChargers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChargers(); }, [fetchChargers]);

  return { chargers, loading, refresh: fetchChargers };
};

// ─── useShift ─────────────────────────────────────────────────────────────────

export const useShift = () => {
  const [openShift, setOpenShift] = useState<ShiftRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const openShiftFn = async (kwh_start: string, notes?: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await api.post("api/chargers/shifts/open/", { kwh_start, notes });
      setOpenShift(res.data.data);
      successToast("Shift opened");
      return true;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to open shift");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const closeShiftFn = async (shiftId: number, kwh_end: string, notes?: string): Promise<boolean> => {
    setLoading(true);
    try {
      await api.patch(`api/chargers/shifts/${shiftId}/close/`, { kwh_end, notes });
      setOpenShift(null);
      successToast("Shift closed");
      return true;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to close shift");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { openShift, setOpenShift, loading, openShiftFn, closeShiftFn };
};

// ─── useSession ───────────────────────────────────────────────────────────────

export const useSession = () => {
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMySessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("api/sessions/my-sessions/");
      const all: Session[] = Array.isArray(res.data?.data) ? res.data.data : [];
      setActiveSessions(all.filter(s => s.ended_at === null));
    } catch {
      errorToast("Failed to load sessions");
      setActiveSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMySessions(); }, [fetchMySessions]);

  const startSession = async (charger_id: number, plate_number: string): Promise<boolean> => {
    try {
      const res = await api.post("api/sessions/start/", { charger_id, plate_number });
      setActiveSessions(prev => [...prev, res.data.data]);
      successToast("Session started");
      return true;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to start session");
      return false;
    }
  };

  const endSession = async (session_id: number, watt_consumed: string): Promise<boolean> => {
    try {
      const res = await api.post("api/sessions/end/", { session_id, watt_consumed });
      setActiveSessions(prev => prev.filter(s => s.id !== session_id));
      successToast(`Session ended — Total: $${parseFloat(res.data.data.total_price).toFixed(2)}`);
      return true;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to end session");
      return false;
    }
  };

  return { activeSessions, loading, startSession, endSession, fetchMySessions };
};

// ─── useRegisterCar ───────────────────────────────────────────────────────────

export const useRegisterCar = () => {
  const [loading, setLoading] = useState(false);

  const registerCar = async (plate_number: string, optional_info?: string): Promise<Car | null> => {
    setLoading(true);
    try {
      const res = await api.post("api/sessions/register-car/", { plate_number, optional_info });
      successToast(res.data.message);
      return res.data.data as Car;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to register car");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const searchCar = async (plate: string): Promise<Car | null> => {
    try {
      const res = await api.get(`api/sessions/search-car/?plate=${plate.toUpperCase()}`);
      return res.data.data as Car;
    } catch {
      return null;
    }
  };

  return { registerCar, searchCar, loading };
};

// ─── useStaffHistory ──────────────────────────────────────────────────────────

export const useStaffHistory = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [sessionsRes, shiftsRes] = await Promise.all([
          api.get("api/sessions/my-sessions/"),
          api.get("api/chargers/shifts/history/"),
        ]);
        setSessions(Array.isArray(sessionsRes.data?.data) ? sessionsRes.data.data : []);
        setShifts(Array.isArray(shiftsRes.data?.data) ? shiftsRes.data.data : []);
      } catch {
        errorToast("Failed to load history");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return { sessions, shifts, loading };
};

// ─── useStaffReports ──────────────────────────────────────────────────────────

export const useStaffReports = () => {
  const [reports, setReports] = useState<StaffReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await api.get("api/stations/my-reports/");
        setReports(res.data.data);
      } catch {
        errorToast("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  return { reports, loading };
};