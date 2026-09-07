import { useState, useCallback, useRef } from "react";
import { successToast, errorToast } from "@/utils/toast";
import api from "@/utils/axios";
import { unwrapPage, emptyPageMeta, type PageMeta } from "@/utils/pagination";
import type { PortSide, Session, SessionUpdatePayload } from "./useStaff";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionReportRow {
  id: number; // session id — used to edit the row via PATCH /api/sessions/<id>/update/
  shift_id: number;
  staff_name: string;
  station_name: string;
  charger_name: string;
  port: PortSide;
  car_plate: string;
  starting_car_percentage: number;
  ending_car_percentage: number | null;
  watt_consumed: string | null;
  is_estimated: boolean;
  duration: string | null;
  total_price: string | null;
  started_at: string;
  ended_at: string | null;
}

export interface ShiftReportRow {
  staff_name: string;
  station_name: string;
  shift_start: string;
  start_kwatts_in_cashpower: string;
  addition_kwatt_in_cashpower: string;
  total_kwatt: string | null;
  total_earned_money_on_shift: string | null;
  total_kwatt_used_on_shift: string | null;
  money_on_momo: string | null;
  end_kwatts_in_cashpower: string | null;
  shift_end: string | null;
  total_car_charged: number | null;
}

export interface CarReportRow {
  plate_number: string;
  owner_name: string | null;
  is_postpaid: boolean;
  times_charged: number;
  total_amount: string;
  amount_paid: string;
  times_paid: number;
  outstanding: string;
}

export interface ReportFilters {
  staff?: number;   // admin only — ignored/can't be overridden for staff requests
  station?: number;
  charger?: number; // sessions report only
  shift?: number;   // sessions report only
  postpaid?: boolean; // cars report only — true = pay-later only, false = prepaid only
  owner?: string;   // car owner name (exact) — applies to sessions, shifts and cars reports
  date_from?: string; // YYYY-MM-DD
  date_to?: string;   // YYYY-MM-DD
}

const buildParams = (filters: ReportFilters): Record<string, string> => {
  const params: Record<string, string> = {};
  if (filters.staff) params.staff = String(filters.staff);
  if (filters.station) params.station = String(filters.station);
  if (filters.charger) params.charger = String(filters.charger);
  if (filters.shift) params.shift = String(filters.shift);
  if (filters.postpaid !== undefined) params.postpaid = String(filters.postpaid);
  if (filters.owner) params.owner = filters.owner;
  if (filters.date_from) params.date_from = filters.date_from;
  if (filters.date_to) params.date_to = filters.date_to;
  return params;
};

const downloadFile = async (path: string, params: Record<string, string>, filename: string): Promise<void> => {
  try {
    const res = await api.get(path, { params, responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch {
    errorToast("Failed to download report");
  }
};

// A paginated report hook: `fetchReport(filters, page)` loads one page, and the
// returned `meta` carries page/total_pages/count for a <Pagination> control. The
// JSON report endpoints are now paginated the same way as the other lists; the
// `/excel/` and `/pdf/` twins still stream the complete, unpaginated data set.
const useReportList = <T>(path: string, exportName: string, errorMsg: string) => {
  const [rows, setRows] = useState<T[]>([]);
  const [meta, setMeta] = useState<PageMeta>(emptyPageMeta);
  const [loading, setLoading] = useState(false);
  // Remember the last query so a caller (e.g. after an edit) can refetch the
  // exact same page without re-threading filters through.
  const last = useRef<{ filters: ReportFilters; page: number }>({ filters: {}, page: 1 });

  const fetchReport = useCallback(async (filters: ReportFilters, page: number = 1) => {
    last.current = { filters, page };
    setLoading(true);
    try {
      const res = await api.get(path, { params: { ...buildParams(filters), page: String(page) } });
      const pg = unwrapPage<T>(res.data?.data);
      setRows(pg.results);
      setMeta(pg);
    } catch {
      errorToast(errorMsg);
      setRows([]);
      setMeta(emptyPageMeta);
    } finally {
      setLoading(false);
    }
  }, [path, errorMsg]);

  const refetch = useCallback(
    () => fetchReport(last.current.filters, last.current.page),
    [fetchReport]
  );

  const downloadExcel = (filters: ReportFilters) =>
    downloadFile(`${path}excel/`, buildParams(filters), `${exportName}.xlsx`);
  const downloadPdf = (filters: ReportFilters) =>
    downloadFile(`${path}pdf/`, buildParams(filters), `${exportName}.pdf`);

  return { rows, meta, loading, fetchReport, refetch, downloadExcel, downloadPdf };
};

// ─── useSessionReport ─────────────────────────────────────────────────────────

export const useSessionReport = () => {
  const base = useReportList<SessionReportRow>(
    "api/reports/sessions/",
    "sessions-report",
    "Failed to load session report"
  );

  // Edit a session straight from the report (admin: any; staff: own only), then
  // refetch the current page so the recomputed row (price/kW/duration) shows.
  const updateSession = async (
    session_id: number,
    payload: SessionUpdatePayload
  ): Promise<Session | null> => {
    try {
      const res = await api.patch(`api/sessions/${session_id}/update/`, payload);
      await base.refetch();
      successToast("Session updated / Byahinduwe");
      return (res.data.data as Session) ?? null;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to update session / Byanze");
      return null;
    }
  };

  return { ...base, updateSession };
};

// ─── useShiftReport ───────────────────────────────────────────────────────────

export const useShiftReport = () =>
  useReportList<ShiftReportRow>("api/reports/shifts/", "shifts-report", "Failed to load shift report");

// ─── useCarReport (admin only — per-car charging & payment summary) ────────────

export const useCarReport = () =>
  useReportList<CarReportRow>("api/reports/cars/", "cars-report", "Failed to load car report");
