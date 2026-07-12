import React, { useMemo, useState } from "react";
import { Card, StatCard, PageHeader, EmptyState, StatSkeleton, Skeleton } from "../components/Shared";
import { TrendChart, BarList } from "../components/Charts";
import {
  IconMoney, IconBolt, IconCharger, IconWallet, IconChart, IconShift,
} from "../components/Icons";
import { rwf, kw } from "../utils/format";
import { useDashboardData } from "../hooks/useDashboard";
import { useAdminStations } from "../hooks/useAdmin";

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────

const RANGE_PRESETS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "All time", days: 0 },
] as const;

const daysAgoISO = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

const num = (v: string | number | null | undefined): number => {
  const n = typeof v === "string" ? parseFloat(v) : v ?? 0;
  return Number.isFinite(n) ? (n as number) : 0;
};

export const AdminDashboard: React.FC = () => {
  const { stations } = useAdminStations();
  const [rangeDays, setRangeDays] = useState<number>(30);
  const [stationId, setStationId] = useState("");

  const filters = useMemo(() => ({
    station: stationId ? parseInt(stationId) : undefined,
    date_from: rangeDays > 0 ? daysAgoISO(rangeDays) : undefined,
  }), [stationId, rangeDays]);

  const { summary, trend, stationUsage, loading } = useDashboardData(filters);

  const trendPoints = useMemo(
    () => trend.map(t => ({ date: t.date, value: Math.round(num(t.revenue)) })),
    [trend]
  );

  const usageRows = useMemo(
    () => [...stationUsage]
      .sort((a, b) => num(b.revenue) - num(a.revenue))
      .map(s => ({
        label: s.station_name,
        value: Math.round(num(s.revenue)),
        sub: `${s.sessions} session${s.sessions === 1 ? "" : "s"} · ${kw(s.kwatt_used)} used`,
      })),
    [stationUsage]
  );

  const hasData = trendPoints.length > 0 || usageRows.length > 0 || num(summary?.total_sessions) > 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle="Performance across all your stations" />

      {/* ── Filters — scope everything below ──────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
          {RANGE_PRESETS.map(p => (
            <button
              key={p.days}
              onClick={() => setRangeDays(p.days)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                rangeDays === p.days ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <select
          className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 shadow-sm outline-none focus:ring-2 focus:ring-green-500/60"
          value={stationId}
          onChange={e => setStationId(e.target.value)}
        >
          <option value="">All stations</option>
          {stations.map(st => (
            <option key={st.id} value={st.id}>{st.name}</option>
          ))}
        </select>
      </div>

      {loading && !summary ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <StatSkeleton /><StatSkeleton /><StatSkeleton />
            <StatSkeleton /><StatSkeleton /><StatSkeleton />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
            <Card className="lg:col-span-3"><Skeleton className="h-52 w-full" /></Card>
            <Card className="lg:col-span-2"><Skeleton className="h-52 w-full" /></Card>
          </div>
        </div>
      ) : (
        <div className={loading ? "opacity-60 transition-opacity space-y-6" : "space-y-6 transition-opacity"}>

          {/* ── KPI tiles ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <StatCard label="Total revenue" value={rwf(summary?.total_revenue)} icon={<IconMoney className="w-5 h-5" />} tone="green" />
            <StatCard label="Expenses" value={rwf(summary?.total_expenses)} icon={<IconWallet className="w-5 h-5" />} />
            <StatCard
              label="Net revenue"
              value={rwf(summary?.net_revenue)}
              icon={<IconChart className="w-5 h-5" />}
              tone={num(summary?.net_revenue) < 0 ? "red" : "default"}
            />
            <StatCard label="Energy used" value={kw(summary?.total_kwatt_used)} icon={<IconBolt className="w-5 h-5" />} />
            <StatCard label="Charging sessions" value={num(summary?.total_sessions).toLocaleString()} icon={<IconCharger className="w-5 h-5" />} />
            <StatCard label="Shifts worked" value={num(summary?.total_shifts).toLocaleString()} icon={<IconShift className="w-5 h-5" />} />
          </div>

          {!hasData ? (
            <EmptyState
              icon={<IconChart className="w-6 h-6" />}
              title="No activity in this period"
              hint="Try a wider date range, or check back once charging sessions have been recorded."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
              {/* ── Revenue trend ─────────────────────────────────── */}
              <Card title="Revenue per day" className="lg:col-span-3">
                {trendPoints.length > 0 ? (
                  <TrendChart data={trendPoints} unit="Rwf" />
                ) : (
                  <p className="text-center text-sm text-gray-400 py-10">No revenue in this period</p>
                )}
              </Card>

              {/* ── Station usage ─────────────────────────────────── */}
              <Card title="Revenue by station" className="lg:col-span-2">
                {usageRows.length > 0 ? (
                  <BarList rows={usageRows} unit="Rwf" />
                ) : (
                  <p className="text-center text-sm text-gray-400 py-10">No station activity yet</p>
                )}
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
