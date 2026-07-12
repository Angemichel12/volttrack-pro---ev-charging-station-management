import { useState, useEffect, useCallback } from "react";
import { errorToast } from "@/utils/toast";
import api from "@/utils/axios";
import { safeArray } from "@/utils/safeArray";

// ─── Types (per /api/dashboard/ contract) ─────────────────────────────────────

export interface DashboardFilters {
  station?: number;
  date_from?: string; // YYYY-MM-DD, inclusive
  date_to?: string;
}

export interface DashboardSummary {
  total_revenue: string | number | null;
  total_kwatt_used: string | number | null;
  total_sessions: number | null;
  total_shifts: number | null;
  stations: number | null;
  // admin only:
  total_expenses?: string | number | null;
  net_revenue?: string | number | null;
}

export interface RevenueTrendPoint {
  date: string;
  revenue: string | number;
  expenses?: string | number; // admin only, days with recorded expenses
}

export interface StationUsageRow {
  station_id: number;
  station_name: string;
  sessions: number;
  kwatt_used: string | number;
  revenue: string | number;
}

const toQuery = (filters: DashboardFilters): string => {
  const params = new URLSearchParams();
  if (filters.station) params.set("station", String(filters.station));
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

// ─── useDashboardData — summary + revenue trend + station usage in one go ─────

export const useDashboardData = (filters: DashboardFilters) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trend, setTrend] = useState<RevenueTrendPoint[]>([]);
  const [stationUsage, setStationUsage] = useState<StationUsageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const { station, date_from, date_to } = filters;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const qs = toQuery({ station, date_from, date_to });
    try {
      const [summaryRes, trendRes, usageRes] = await Promise.all([
        api.get(`api/dashboard/summary/${qs}`),
        api.get(`api/dashboard/revenue-trend/${qs}`),
        api.get(`api/dashboard/station-usage/${qs}`),
      ]);
      setSummary(summaryRes.data?.data ?? null);
      setTrend(safeArray<RevenueTrendPoint>(trendRes.data?.data));
      setStationUsage(safeArray<StationUsageRow>(usageRes.data?.data));
    } catch {
      errorToast("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [station, date_from, date_to]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { summary, trend, stationUsage, loading, refresh: fetchAll };
};
