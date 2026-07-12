import { useState, useEffect, useCallback } from "react";
import { successToast, errorToast } from "@/utils/toast";
import api from "@/utils/axios";
import { safeArray } from "@/utils/safeArray";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PortSide = "left" | "right";

export interface ChargerPort {
  port: PortSide;
  available: boolean;
}

export interface StationCharger {
  id: number;
  name: string;
  station: number;
  station_name: string;
  ports: ChargerPort[];
}

export interface StationOption {
  id: number;
  name: string;
  price_per_watt: string | null;
}

export interface Car {
  id: number;
  plate_number: string;
  owner_name: string | null;
  phone_number: string | null;
  optional_info: string | null;
  unique_price?: string | null; // admin-only — absent from the staff response entirely
  created_at: string;
}

export interface Session {
  id: number;
  station: number;
  station_name: string;
  charger: number;
  charger_name: string;
  port: PortSide;
  staff: number;
  shift: number;
  car: number;
  car_plate: string;
  starting_car_percentage: number;
  ending_car_percentage: number | null;
  watt_consumed: string | null;
  total_price: string | null;
  duration: string | null;
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
  start_kwatts_in_cashpower: string;
  addition_kwatt_in_cashpower: string;
  total_kwatt: string | null;
  total_earned_money_on_shift: string | null;
  total_kwatt_used_on_shift: string | null;
  total_car_charged: number | null;
  money_on_momo: string | null;
  end_kwatts_in_cashpower: string | null;
  notes: string;
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
  shift_history: ShiftRecord[];
}

// ─── useStations (for picking a station when opening a shift) ─────────────────

export const useStations = () => {
  const [stations, setStations] = useState<StationOption[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("api/stations/");
      setStations(safeArray<StationOption>(res.data?.data));
    } catch {
      setStations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStations(); }, [fetchStations]);

  return { stations, loading, refresh: fetchStations };
};

// ─── useStaffDashboard ────────────────────────────────────────────────────────

export const useStaffDashboard = () => {
  const [data, setData] = useState<StaffDashboard | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("api/stations/dashboard/");
      setData(res.data.data ?? null);
    } catch (e: any) {
      // 404 just means no open shift — a normal state, not an error.
      if (e?.response?.status !== 404) errorToast("Failed to load dashboard");
      setData(null);
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
      setChargers(safeArray<StationCharger>(raw));
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

  const openShiftFn = async (
    station: number,
    start_kwatts_in_cashpower: string,
    notes?: string
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await api.post("api/chargers/shifts/open/", {
        station,
        start_kwatts_in_cashpower,
        notes,
      });
      setOpenShift(res.data.data ?? null);
      successToast("Shift opened");
      return true;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to open shift");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addCashpowerFn = async (shiftId: number, amount: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await api.patch(`api/chargers/shifts/${shiftId}/add-cashpower/`, { amount });
      setOpenShift(res.data.data ?? null);
      successToast("Cashpower added");
      return true;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to add cashpower");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const closeShiftFn = async (
    shiftId: number,
    money_on_momo: string,
    end_kwatts_in_cashpower: string,
    notes?: string
  ): Promise<boolean> => {
    setLoading(true);
    try {
      await api.patch(`api/chargers/shifts/${shiftId}/close/`, { money_on_momo, end_kwatts_in_cashpower, notes });
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

  return { openShift, setOpenShift, loading, openShiftFn, addCashpowerFn, closeShiftFn };
};

// ─── useSession ───────────────────────────────────────────────────────────────

export const useSession = () => {
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMySessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("api/sessions/my-sessions/");
      const all = safeArray<Session>(res.data?.data);
      setActiveSessions(all.filter(s => s.ended_at === null));
    } catch {
      errorToast("Failed to load sessions");
      setActiveSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMySessions(); }, [fetchMySessions]);

  const startSession = async (
    charger_id: number,
    port: PortSide,
    plate_number: string,
    starting_car_percentage: number
  ): Promise<boolean> => {
    try {
      const res = await api.post("api/sessions/start/", { charger_id, port, plate_number, starting_car_percentage });
      setActiveSessions(prev => [...prev, res.data.data]);
      successToast("Session started");
      return true;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to start session");
      return false;
    }
  };

  // Returns the completed session (with computed total_price/duration) so the
  // UI can present the price — no toast here.
  const endSession = async (
    session_id: number,
    watt_consumed: string,
    ending_car_percentage: number
  ): Promise<Session | null> => {
    try {
      const res = await api.post("api/sessions/end/", { session_id, watt_consumed, ending_car_percentage });
      setActiveSessions(prev => prev.filter(s => s.id !== session_id));
      return (res.data.data as Session) ?? null;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to end session");
      return null;
    }
  };

  return { activeSessions, loading, startSession, endSession, fetchMySessions };
};

// ─── useRegisterCar ───────────────────────────────────────────────────────────

export const useRegisterCar = () => {
  const [loading, setLoading] = useState(false);

  const registerCar = async (
    plate_number: string,
    owner_name?: string,
    phone_number?: string,
    optional_info?: string
  ): Promise<Car | null> => {
    setLoading(true);
    try {
      const res = await api.post("api/sessions/register-car/", { plate_number, owner_name, phone_number, optional_info });
      successToast(res.data.message);
      return res.data.data as Car;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to register car");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Type-ahead: matches anywhere in the plate (case-insensitive), up to 20 results, [] if none.
  const searchCar = async (plate: string): Promise<Car[]> => {
    try {
      const res = await api.get(`api/sessions/search-car/?plate=${encodeURIComponent(plate)}`);
      return safeArray<Car>(res.data?.data);
    } catch {
      return [];
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
        setSessions(safeArray<Session>(sessionsRes.data?.data));
        setShifts(safeArray<ShiftRecord>(shiftsRes.data?.data));
      } catch {
        errorToast("Failed to load history");
        setSessions([]);
        setShifts([]);
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
        const data = res.data.data;
        // Normalize nested arrays so .map() never crashes
        setReports(data ? {
          ...data,
          charger_usage:  safeArray(data.charger_usage),
          shift_history:  safeArray(data.shift_history),
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