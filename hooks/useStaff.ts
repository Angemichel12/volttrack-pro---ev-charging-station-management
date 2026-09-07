import { useState, useEffect, useCallback } from "react";
import { successToast, errorToast } from "@/utils/toast";
import api from "@/utils/axios";
import { safeArray } from "@/utils/safeArray";
import { unwrapPage, emptyPageMeta, type PageMeta } from "@/utils/pagination";

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
  is_postpaid?: boolean;        // admin-only — pay-later car (settles debt later, not at charge time)
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
  is_estimated: boolean; // true when kWh was auto-estimated after a power outage
  total_price: string | null;
  is_paid: boolean;          // false for an unsettled postpaid (pay-later) charge
  amount_paid: string | null; // 0 until a postpaid car's debt is settled
  duration: string | null;
  started_at: string;
  ended_at: string | null;
}

// Fields the backend lets you edit on an existing session via
// PATCH /api/sessions/<id>/update/. Only the fields sent are changed; derived
// values (total_price, is_paid, amount_paid, duration) are recomputed server-side.
export interface SessionUpdatePayload {
  started_at?: string;              // ISO-8601
  ended_at?: string;                // ISO-8601
  starting_car_percentage?: number;
  ending_car_percentage?: number;
  watt_consumed?: string;
  port?: PortSide;
}

// A complete past charge entered after the fact. There's no single "create
// finished session" endpoint, so this is composed of start → end → (correct
// the end time) under the hood — see `addManualSession`.
export interface ManualSessionInput {
  charger_id: number;
  port: PortSide;
  plate_number: string;
  starting_car_percentage: number;
  ending_car_percentage: number;
  watt_consumed: string;
  started_at?: string;              // ISO-8601 — when the charge really began
  ended_at?: string;                // ISO-8601 — when it really finished
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
      setStations(unwrapPage<StationOption>(res.data?.data).results);
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
      setChargers(unwrapPage<StationCharger>(res.data?.data ?? res.data).results);
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
      successToast("Shift opened / shifuti yafunguwe");
      return true;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to open shift / Byanze");
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
      successToast("Cashpower added / Cashpower yongewe");
      return true;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to add cashpower / Byanze");
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
      successToast("Shift closed / shifuti yafunzwe");
      return true;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to close shift / Byanze");
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
      // my-sessions is paginated & newest-first, so any still-active session is
      // on the first page — that's all we need for the "charging now" list.
      const res = await api.get("api/sessions/my-sessions/");
      const all = unwrapPage<Session>(res.data?.data).results;
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
      successToast("Charging started / Gusharija byatangiye");
      return true;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to start / Byanze");
      return false;
    }
  };

  // Returns the completed session (with computed total_price/duration) so the
  // UI can present the price — no toast here.
  // Two modes: normal (pass watt_consumed) or power-outage (power_outage=true,
  // watt_consumed omitted — the server estimates kWh from the car's history).
  const endSession = async (
    session_id: number,
    ending_car_percentage: number,
    watt_consumed?: string,
    power_outage?: boolean
  ): Promise<Session | null> => {
    try {
      const payload: Record<string, unknown> = { session_id, ending_car_percentage };
      if (power_outage) payload.power_outage = true;
      else payload.watt_consumed = watt_consumed;
      const res = await api.post("api/sessions/end/", payload);
      setActiveSessions(prev => prev.filter(s => s.id !== session_id));
      return (res.data.data as Session) ?? null;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to end / Byanze");
      return null;
    }
  };

  // Record a charge that already happened, start-to-finish, in one action.
  // The API has no "create completed session" call, so we compose it:
  //   1. start (backdated with started_at) — claims a free charger port
  //   2. end (watt_consumed + ending %) — prices it and settles prepaid cars
  //   3. update ended_at — so the finish time reflects reality, not "now"
  // Returns the finished, priced session (for the confirmation popup). If step 1
  // succeeds but a later step fails, the half-started session is left active so
  // the staff can see it and finish it by hand.
  const addManualSession = async (input: ManualSessionInput): Promise<Session | null> => {
    try {
      const startRes = await api.post("api/sessions/start/", {
        charger_id: input.charger_id,
        port: input.port,
        plate_number: input.plate_number,
        starting_car_percentage: input.starting_car_percentage,
        ...(input.started_at ? { started_at: input.started_at } : {}),
      });
      const started = startRes.data.data as Session;

      const endRes = await api.post("api/sessions/end/", {
        session_id: started.id,
        watt_consumed: input.watt_consumed,
        ending_car_percentage: input.ending_car_percentage,
      });
      let finished = endRes.data.data as Session;

      if (input.ended_at) {
        const upRes = await api.patch(`api/sessions/${started.id}/update/`, { ended_at: input.ended_at });
        finished = (upRes.data.data as Session) ?? finished;
      }

      // Completed, so it never joins the "charging now" list; drop it if the
      // optimistic start added it.
      setActiveSessions(prev => prev.filter(s => s.id !== finished.id));
      successToast("Session added / Gusharija byanditswe");
      return finished;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to add session / Byanze");
      // Surface any orphaned active session from a partial failure.
      fetchMySessions();
      return null;
    }
  };

  // Edit an existing session (backdate a charge entered late, fix the metered
  // kWh, correct percentages, or move it to the other port). Only the fields you
  // pass are changed; the server recomputes total_price/is_paid/duration.
  const updateSession = async (
    session_id: number,
    payload: SessionUpdatePayload
  ): Promise<Session | null> => {
    try {
      const res = await api.patch(`api/sessions/${session_id}/update/`, payload);
      const updated = (res.data.data as Session) ?? null;
      if (updated) {
        setActiveSessions(prev =>
          // Keep it in the active list only while it's still unfinished.
          updated.ended_at === null
            ? prev.map(s => (s.id === session_id ? updated : s))
            : prev.filter(s => s.id !== session_id)
        );
      }
      successToast("Session updated / Byahinduwe");
      return updated;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to update session / Byanze");
      return null;
    }
  };

  return { activeSessions, loading, startSession, endSession, addManualSession, updateSession, fetchMySessions };
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
      errorToast(e?.response?.data?.message || "Failed to register car / Byanze");
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
  const [sessionsMeta, setSessionsMeta] = useState<PageMeta>(emptyPageMeta);
  const [shiftsMeta, setShiftsMeta] = useState<PageMeta>(emptyPageMeta);
  const [loading, setLoading] = useState(false);

  const fetchSessions = useCallback(async (page: number = 1) => {
    try {
      const res = await api.get("api/sessions/my-sessions/", { params: { page } });
      const pg = unwrapPage<Session>(res.data?.data);
      setSessions(pg.results);
      setSessionsMeta(pg);
    } catch {
      errorToast("Failed to load sessions");
      setSessions([]);
    }
  }, []);

  const fetchShifts = useCallback(async (page: number = 1) => {
    try {
      const res = await api.get("api/chargers/shifts/history/", { params: { page } });
      const pg = unwrapPage<ShiftRecord>(res.data?.data);
      setShifts(pg.results);
      setShiftsMeta(pg);
    } catch {
      errorToast("Failed to load shifts");
      setShifts([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSessions(1), fetchShifts(1)]).finally(() => setLoading(false));
  }, [fetchSessions, fetchShifts]);

  // Edit one of the staff's own past sessions; reflect the recomputed row in place.
  const updateSession = async (
    session_id: number,
    payload: SessionUpdatePayload
  ): Promise<Session | null> => {
    try {
      const res = await api.patch(`api/sessions/${session_id}/update/`, payload);
      const updated = res.data.data as Session;
      setSessions(prev => prev.map(s => (s.id === session_id ? updated : s)));
      successToast("Session updated / Byahinduwe");
      return updated;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to update session / Byanze");
      return null;
    }
  };

  return {
    sessions,
    shifts,
    loading,
    sessionsPage: sessionsMeta.page,
    sessionsTotalPages: sessionsMeta.total_pages,
    sessionsCount: sessionsMeta.count,
    changeSessionsPage: fetchSessions,
    shiftsPage: shiftsMeta.page,
    shiftsTotalPages: shiftsMeta.total_pages,
    shiftsCount: shiftsMeta.count,
    changeShiftsPage: fetchShifts,
    updateSession,
  };
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