import React, { useState } from "react";
import { Card, StatCard } from "../components/Shared";
import { useStaffReports } from "../hooks/useStaff";

export const StaffReports: React.FC = () => {
  const { reports, loading } = useStaffReports();
  const [tab, setTab] = useState<"chargers" | "shifts">("chargers");

  const summary   = reports?.summary;
  const chargers  = reports?.charger_usage  ?? [];
  const shifts    = reports?.shift_history  ?? [];

  const closedShifts = shifts.filter(s => s.shift_end !== null);
  const totalKwh = closedShifts.reduce(
    (sum, s) => sum + parseFloat(s.kwh_consumed || "0"), 0
  );

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────────── */}
      <h2 className="text-2xl font-bold">My Station Reports</h2>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading reports...</div>
      ) : (
        <>
          {/* ── Summary Stats ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Earnings"
              value={`$${parseFloat(summary?.total_earnings || "0").toFixed(2)}`}
              icon="💵"
            />
            <StatCard
              label="Watts Consumed"
              value={`${parseFloat(summary?.total_watt || "0").toLocaleString()}W`}
              icon="⚡"
            />
            <StatCard
              label="Total Sessions"
              value={summary?.total_sessions ?? 0}
              icon="🔌"
            />
            <StatCard
              label="Total kWh (Shifts)"
              value={`${totalKwh.toFixed(2)} kWh`}
              icon="📊"
            />
          </div>

          {/* ── Tabs ──────────────────────────────────────────────── */}
          <div className="flex gap-2 border-b border-gray-200">
            {(["chargers", "shifts"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                  tab === t
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                {t === "chargers" ? "Charger Usage" : "Shift History"}
              </button>
            ))}
          </div>

          {tab === "chargers" ? (
            // ── Charger Usage ─────────────────────────────────────
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chargers.length === 0 && (
                  <div className="col-span-3 text-center py-12 border border-dashed rounded-xl text-gray-400">
                    No charger data yet
                  </div>
                )}
                {chargers.map((c: any) => (
                  <Card key={c.charger__id}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{c.charger__name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{c.sessions} sessions</p>
                      </div>
                      <span className="text-xl">🔌</span>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                        Total Earnings
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${parseFloat(c.earnings || "0").toFixed(2)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Charger table */}
              {chargers.length > 0 && (
                <Card title="Charger Summary">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="text-left border-b border-gray-100">
                        <tr className="text-xs text-gray-400 uppercase tracking-wider">
                          <th className="pb-3 px-2">Charger</th>
                          <th className="pb-3 px-2">Sessions</th>
                          <th className="pb-3 px-2">Earnings</th>
                          <th className="pb-3 px-2">% Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {chargers.map((c: any) => {
                          const earnings = parseFloat(c.earnings || "0");
                          const total    = parseFloat(summary?.total_earnings || "0");
                          const pct      = total > 0
                            ? ((earnings / total) * 100).toFixed(1)
                            : "0.0";
                          return (
                            <tr key={c.charger__id} className="text-sm">
                              <td className="py-3 px-2 font-medium">{c.charger__name}</td>
                              <td className="py-3 px-2">{c.sessions}</td>
                              <td className="py-3 px-2 font-semibold text-blue-600">
                                ${earnings.toFixed(2)}
                              </td>
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-20">
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
                    </table>
                  </div>
                </Card>
              )}
            </>
          ) : (
            // ── Shift History ─────────────────────────────────────
            <Card title="Shift History">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="text-left border-b border-gray-100">
                    <tr className="text-xs text-gray-400 uppercase tracking-wider">
                      <th className="pb-3 px-2">Staff</th>
                      <th className="pb-3 px-2">Shift Start</th>
                      <th className="pb-3 px-2">Shift End</th>
                      <th className="pb-3 px-2">kWh Start</th>
                      <th className="pb-3 px-2">kWh End</th>
                      <th className="pb-3 px-2">Consumed</th>
                      <th className="pb-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {shifts.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-400">
                          No shifts yet
                        </td>
                      </tr>
                    )}
                    {shifts.map((sh: any, i: number) => (
                      <tr key={i} className="text-sm">
                        <td className="py-3 px-2 font-medium">{sh.staff__name}</td>
                        <td className="py-3 px-2 text-gray-400 text-xs">
                          {new Date(sh.shift_start).toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-gray-400 text-xs">
                          {sh.shift_end ? new Date(sh.shift_end).toLocaleString() : "—"}
                        </td>
                        <td className="py-3 px-2">{sh.kwh_start}</td>
                        <td className="py-3 px-2">{sh.kwh_end ?? "—"}</td>
                        <td className="py-3 px-2 font-semibold text-blue-600">
                          {sh.kwh_consumed ? `${sh.kwh_consumed} kWh` : "—"}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            sh.shift_end
                              ? "bg-green-50 text-green-600"
                              : "bg-orange-50 text-orange-500 animate-pulse"
                          }`}>
                            {sh.shift_end ? "Closed" : "Open"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* Totals row */}
                  {closedShifts.length > 0 && (
                    <tfoot className="border-t-2 border-gray-200">
                      <tr className="text-sm font-bold">
                        <td className="pt-3 px-2" colSpan={5}>Total kWh Consumed</td>
                        <td className="pt-3 px-2 text-blue-600">{totalKwh.toFixed(2)} kWh</td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};