import { useState, useCallback } from "react";
import { errorToast } from "@/utils/toast";
import api from "@/utils/axios";
import { safeArray } from "@/utils/safeArray";
import type { PortSide } from "./useStaff";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionReportRow {
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

// ─── useSessionReport ─────────────────────────────────────────────────────────

export const useSessionReport = () => {
  const [rows, setRows] = useState<SessionReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async (filters: ReportFilters) => {
    setLoading(true);
    try {
      const res = await api.get("api/reports/sessions/", { params: buildParams(filters) });
      setRows(safeArray<SessionReportRow>(res.data?.data));
    } catch {
      errorToast("Failed to load session report");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadExcel = (filters: ReportFilters) =>
    downloadFile("api/reports/sessions/excel/", buildParams(filters), "sessions-report.xlsx");

  const downloadPdf = (filters: ReportFilters) =>
    downloadFile("api/reports/sessions/pdf/", buildParams(filters), "sessions-report.pdf");

  return { rows, loading, fetchReport, downloadExcel, downloadPdf };
};

// ─── useShiftReport ───────────────────────────────────────────────────────────

export const useShiftReport = () => {
  const [rows, setRows] = useState<ShiftReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async (filters: ReportFilters) => {
    setLoading(true);
    try {
      const res = await api.get("api/reports/shifts/", { params: buildParams(filters) });
      setRows(safeArray<ShiftReportRow>(res.data?.data));
    } catch {
      errorToast("Failed to load shift report");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadExcel = (filters: ReportFilters) =>
    downloadFile("api/reports/shifts/excel/", buildParams(filters), "shifts-report.xlsx");

  const downloadPdf = (filters: ReportFilters) =>
    downloadFile("api/reports/shifts/pdf/", buildParams(filters), "shifts-report.pdf");

  return { rows, loading, fetchReport, downloadExcel, downloadPdf };
};

// ─── useCarReport (admin only — per-car charging & payment summary) ────────────

export const useCarReport = () => {
  const [rows, setRows] = useState<CarReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async (filters: ReportFilters) => {
    setLoading(true);
    try {
      const res = await api.get("api/reports/cars/", { params: buildParams(filters) });
      setRows(safeArray<CarReportRow>(res.data?.data));
    } catch {
      errorToast("Failed to load car report");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadExcel = (filters: ReportFilters) =>
    downloadFile("api/reports/cars/excel/", buildParams(filters), "cars-report.xlsx");

  const downloadPdf = (filters: ReportFilters) =>
    downloadFile("api/reports/cars/pdf/", buildParams(filters), "cars-report.pdf");

  return { rows, loading, fetchReport, downloadExcel, downloadPdf };
};
