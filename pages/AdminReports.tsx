import React, { useState } from "react";
import { Card, StatCard } from "../components/Shared";
import { useAdminReports, useAdminStations } from "../hooks/useAdmin";

export const AdminReports: React.FC = () => {
  const { reports, loading } = useAdminReports();
  const { stations } = useAdminStations();
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">System Reports</h2>
        <select
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-56"
          value={activeStation}
          onChange={e => setActiveStation(e.target.value === "all" ? "all" : parseInt(e.target.value))}
        >
          <option value="all">All Stations</option>
          {stations.map(st => (
            <option key={st.id} value={st.id}>{st.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading reports...</div>
      ) : (
        <>
          {/* ── Summary Stats ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Total Earnings"
              value={`Rwf ${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              icon="💰"
            />
            <StatCard
              label="Watts Consumed"
              value={`${totalWatt.toLocaleString()}W`}
              icon="⚡"
            />
            <StatCard
              label="Total Sessions"
              value={totalSessions}
              icon="🔌"
            />
          </div>

          {/* ── Per Station Breakdown ─────────────────────────────── */}
          <Card title="Station Breakdown">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-left border-b border-gray-100">
                  <tr className="text-xs text-gray-400 uppercase tracking-wider">
                    <th className="pb-3 px-2">Station</th>
                    <th className="pb-3 px-2">Rate</th>
                    <th className="pb-3 px-2">Sessions</th>
                    <th className="pb-3 px-2">Watts Used</th>
                    <th className="pb-3 px-2">Earnings</th>
                    <th className="pb-3 px-2">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-400">
                        No data yet
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
                          {info?.price_per_watt ? `Rwf ${info.price_per_watt}/W` : "—"}
                        </td>
                        <td className="py-3 px-2">{st.sessions}</td>
                        <td className="py-3 px-2">{wattUsed.toLocaleString()}W</td>
                        <td className="py-3 px-2 font-semibold text-blue-600">
                          Rwf {earnings.toFixed(2)}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-24">
                              <div
                                className="bg-blue-500 h-1.5 rounded-full"
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
                      <td className="pt-3 px-2">{totalWatt.toLocaleString()}W</td>
                      <td className="pt-3 px-2 text-blue-600">Rwf {totalEarnings.toFixed(2)}</td>
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
                        Rate: {st.price_per_watt ? `Rwf ${st.price_per_watt}/W` : "Not set"}
                      </p>
                    </div>
                    <span className="text-xl">⛽</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {[
                      ["Sessions",  data?.sessions   ?? 0],
                      ["Earnings",  data ? `Rwf ${parseFloat(data.earnings || "0").toFixed(2)}` : "Rwf 0.00"],
                      ["Watts",     data ? `${parseFloat(data.watt_used || "0").toLocaleString()}W` : "0W"],
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
      )}
    </div>
  );
};