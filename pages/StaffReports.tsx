import React, { useState } from "react";
import { Card, StatCard, PageHeader, StatSkeleton, TableSkeleton } from "../components/Shared";
import { IconBolt, IconMoney, IconCharger, IconShift } from "../components/Icons";
import { rwf, kw } from "../utils/format";
import { useStaffReports } from "../hooks/useStaff";
import { ReportPanel } from "./DetailedReports";

type Tab = "chargers" | "sessions" | "shifts";

const TABS: { key: Tab; label: string }[] = [
  { key: "chargers", label: "Chargers" },
  { key: "sessions", label: "Sessions / Gusharija" },
  { key: "shifts", label: "Shifts / Zamu" },
];

export const StaffReports: React.FC = () => {
  const { reports, loading } = useStaffReports();
  const [tab, setTab] = useState<Tab>("chargers");

  const summary   = reports?.summary;
  const chargers  = reports?.charger_usage  ?? [];
  const shifts    = reports?.shift_history  ?? [];

  const closedShifts = shifts.filter(s => s.shift_end !== null);
  const totalKwh = closedShifts.reduce(
    (sum, s) => sum + parseFloat(s.total_kwatt_used_on_shift || "0"), 0
  );

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────────── */}
      <PageHeader
        title="Reports / Raporo"
        subtitle="Download Excel / PDF"
      />

      {loading ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
          </div>
          <Card><TableSkeleton rows={5} cols={4} /></Card>
        </>
      ) : (
        <>
          {/* ── Summary Stats ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              label="Earnings / Ayinjiye"
              value={rwf(summary?.total_earnings)}
              icon={<IconMoney className="w-5 h-5" />}
              tone="green"
            />
            <StatCard
              label="kW used / kW zakoreshejwe"
              value={kw(summary?.total_watt)}
              icon={<IconBolt className="w-5 h-5" />}
            />
            <StatCard
              label="Sessions / Gusharija"
              value={summary?.total_sessions ?? 0}
              icon={<IconCharger className="w-5 h-5" />}
            />
            <StatCard
              label="Total kWh (shifts)"
              value={`${totalKwh.toFixed(2)} kWh`}
              icon={<IconShift className="w-5 h-5" />}
            />
          </div>

          {/* ── Tabs ──────────────────────────────────────────────── */}
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

          {/* ── Sessions / Shifts — filterable data + downloads ───── */}
          {tab !== "chargers" && <ReportPanel type={tab} isAdmin={false} />}

          {/* ── Charger Usage ─────────────────────────────────────── */}
          {tab === "chargers" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chargers.length === 0 && (
                  <div className="col-span-full text-center py-12 border border-dashed rounded-2xl text-gray-400">
                    No data / Nta makuru
                  </div>
                )}
                {chargers.map((c: any) => (
                  <Card key={c.charger__id}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{c.charger__name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{c.sessions} sessions</p>
                      </div>
                      <span className="w-9 h-9 rounded-xl bg-green-50 text-green-700 flex items-center justify-center">
                        <IconCharger className="w-5 h-5" />
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                        Earnings / Ayinjiye
                      </p>
                      <p className="text-2xl font-bold text-green-700">
                        {rwf(c.earnings)}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Charger table */}
              {chargers.length > 0 && (
                <Card title="Chargers">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px]">
                      <thead className="text-left border-b border-gray-100">
                        <tr className="text-xs text-gray-400 uppercase tracking-wider">
                          <th className="pb-3 px-2">Charger</th>
                          <th className="pb-3 px-2">Sessions / Gusharija</th>
                          <th className="pb-3 px-2">Earnings / Ayinjiye</th>
                          <th className="pb-3 px-2">%</th>
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
                              <td className="py-3 px-2 font-semibold text-green-700">
                                {rwf(earnings)}
                              </td>
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-20">
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
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};
