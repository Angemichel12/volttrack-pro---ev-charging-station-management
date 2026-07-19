import React, { useState } from "react";
import { Card, StatCard, PageHeader, StatSkeleton, TableSkeleton } from "../components/Shared";
import { IconBolt, IconMoney, IconCharger, IconStation } from "../components/Icons";
import { rwf, kw } from "../utils/format";
import { useAdminReports, useAdminStations, useAdminEmployees } from "../hooks/useAdmin";
import { ReportPanel } from "./DetailedReports";

type Tab = "overview" | "sessions" | "shifts";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview / Incamake" },
  { key: "sessions", label: "Sessions / Gusharija" },
  { key: "shifts", label: "Shifts / Zamu" },
];

export const AdminReports: React.FC = () => {
  const { reports, loading } = useAdminReports();
  const { stations } = useAdminStations();
  const { employees } = useAdminEmployees();
  const [tab, setTab] = useState<Tab>("overview");
  const [activeStation, setActiveStation] = useState<number | "all">("all");

  const perStation: any[] = Array.isArray(reports?.per_station) ? reports.per_station : [];

  const filtered = activeStation === "all"
    ? perStation
    : perStation.filter(s => s.station__id === activeStation);

  const totalEarnings = parseFloat(reports?.summary?.total_earnings || "0");
  const totalWatt     = parseFloat(reports?.summary?.total_watt     || "0");
  const totalSessions = reports?.summary?.total_sessions ?? 0;

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────────── */}
      <PageHeader
        title="Reports / Raporo"
        subtitle="Download Excel / PDF"
      />

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              tab === t.key
                ? "border-green-600 text-green-700"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Sessions / Shifts — filterable data + downloads ───────── */}
      {tab !== "overview" && (
        <ReportPanel type={tab} isAdmin employees={employees} />
      )}

      {/* ── Overview ─────────────────────────────────────────────── */}
      {tab === "overview" && (loading ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <StatSkeleton /><StatSkeleton /><StatSkeleton />
          </div>
          <Card><TableSkeleton rows={5} cols={6} /></Card>
        </>
      ) : (
        <>
          <div className="flex justify-end">
            <select
              className="px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm outline-none focus:ring-2 focus:ring-green-500/60 w-full sm:w-56"
              value={activeStation}
              onChange={e => setActiveStation(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            >
              <option value="all">All / Zose</option>
              {stations.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>

          {/* ── Summary Stats ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <StatCard
              label="Earnings / Ayinjiye"
              value={rwf(totalEarnings)}
              icon={<IconMoney className="w-5 h-5" />}
              tone="green"
            />
            <StatCard
              label="kW used / kW zakoreshejwe"
              value={kw(totalWatt)}
              icon={<IconBolt className="w-5 h-5" />}
            />
            <StatCard
              label="Sessions / Gusharija"
              value={totalSessions}
              icon={<IconCharger className="w-5 h-5" />}
            />
          </div>

          {/* ── Per Station Breakdown ─────────────────────────────── */}
          <Card title="Per Station / Kuri buri Sitasiyo">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="text-left border-b border-gray-100">
                  <tr className="text-xs text-gray-400 uppercase tracking-wider">
                    <th className="pb-3 px-2">Station / Sitasiyo</th>
                    <th className="pb-3 px-2">Price / Igiciro</th>
                    <th className="pb-3 px-2">Sessions / Gusharija</th>
                    <th className="pb-3 px-2">kW</th>
                    <th className="pb-3 px-2">Earnings / Ayinjiye</th>
                    <th className="pb-3 px-2">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">
                        No data / Nta makuru
                      </td>
                    </tr>
                  )}
                  {filtered.map((st: any) => {
                    const info      = stations.find(s => s.id === st.station__id);
                    const earnings  = parseFloat(st.earnings || "0");
                    const wattUsed  = parseFloat(st.watt_used || "0");
                    const pct       = totalEarnings > 0
                      ? ((earnings / totalEarnings) * 100).toFixed(1)
                      : "0.0";
                    return (
                      <tr key={st.station__id} className="text-sm">
                        <td className="py-3 px-2 font-medium">{st.station__name}</td>
                        <td className="py-3 px-2 text-gray-500">
                          {info?.price_per_watt ? `Rwf ${info.price_per_watt}/kW` : "—"}
                        </td>
                        <td className="py-3 px-2">{st.sessions}</td>
                        <td className="py-3 px-2">{kw(wattUsed)}</td>
                        <td className="py-3 px-2 font-semibold text-green-700">
                          {rwf(earnings)}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-24">
                              <div
                                className="bg-green-600 h-1.5 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* ── Totals row ────────────────────────────────── */}
                {filtered.length > 0 && (
                  <tfoot className="border-t-2 border-gray-200">
                    <tr className="text-sm font-bold">
                      <td className="pt-3 px-2">Total</td>
                      <td className="pt-3 px-2">—</td>
                      <td className="pt-3 px-2">{totalSessions}</td>
                      <td className="pt-3 px-2">{kw(totalWatt)}</td>
                      <td className="pt-3 px-2 text-green-700">{rwf(totalEarnings)}</td>
                      <td className="pt-3 px-2">100%</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </Card>

          {/* ── Stations Overview Grid ────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stations.map(st => {
              const data = perStation.find(p => p.station__id === st.id);
              return (
                <Card key={st.id}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{st.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Price / Igiciro: {st.price_per_watt ? `Rwf ${st.price_per_watt}/kW` : "—"}
                      </p>
                    </div>
                    <span className="w-9 h-9 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
                      <IconStation className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {[
                      ["Sessions / Gusharija",  data?.sessions   ?? 0],
                      ["Earnings / Ayinjiye",  data ? rwf(data.earnings) : "Rwf 0"],
                      ["kW",   data ? kw(data.watt_used) : "0 kW"],
                    ].map(([label, val]) => (
                      <div key={String(label)} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-semibold">{val}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      ))}
    </div>
  );
};
