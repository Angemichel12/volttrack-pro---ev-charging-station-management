import React, { useState } from "react";
import { Card, PageHeader, StatCard, TableSkeleton } from "../components/Shared";
import { IconBolt, IconMoney, IconCharger, IconShift } from "../components/Icons";
import { rwf, kw } from "../utils/format";
import { useStaffHistory } from "../hooks/useStaff";

export const StaffHistory: React.FC = () => {
  const { sessions, shifts, loading } = useStaffHistory();
  const [tab, setTab] = useState<"sessions" | "shifts">("sessions");

  const completed = sessions.filter(s => s.ended_at !== null);
  const totalEarnings = completed.reduce((sum, s) => sum + parseFloat(s.total_price || "0"), 0);
  const totalWatt = completed.reduce((sum, s) => sum + parseFloat(s.watt_consumed || "0"), 0);
  const totalKwh = shifts.reduce((sum, s) => sum + parseFloat(s.total_kwatt_used_on_shift || "0"), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="History / Amateka" subtitle="Sessions + shifts / Gusharija + zamu" />

      {/* ── Summary ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Sessions / Gusharija" value={completed.length} icon={<IconCharger className="w-5 h-5" />} />
        <StatCard label="Earnings / Ayinjiye" value={rwf(totalEarnings)} icon={<IconMoney className="w-5 h-5" />} tone="green" />
        <StatCard label="kW used / kW zakoreshejwe" value={kw(totalWatt)} icon={<IconBolt className="w-5 h-5" />} />
        <StatCard label="kWh (shifts)" value={`${totalKwh.toFixed(2)} kWh`} icon={<IconShift className="w-5 h-5" />} />
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-gray-200">
        {(["sessions", "shifts"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-green-600 text-green-700"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t === "sessions" ? "Sessions / Gusharija" : "Shifts / Zamu"}
          </button>
        ))}
      </div>

      {loading ? (
        <Card><TableSkeleton rows={6} cols={tab === "sessions" ? 7 : 8} /></Card>
      ) : tab === "sessions" ? (
        // ── Sessions Table ────────────────────────────────────────
        <Card>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="text-left border-b border-gray-100">
              <tr className="text-xs text-gray-400 uppercase tracking-wider">
                <th className="pb-3 px-2">Plate / Plaque</th>
                <th className="pb-3 px-2">Charger</th>
                <th className="pb-3 px-2">Battery / Batiri</th>
                <th className="pb-3 px-2">kW</th>
                <th className="pb-3 px-2">Price / Igiciro</th>
                <th className="pb-3 px-2">Start / Itangira</th>
                <th className="pb-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sessions.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No sessions / Nta gusharija</td></tr>
              )}
              {sessions.map(s => (
                <tr key={s.id} className="text-sm">
                  <td className="py-3 px-2 font-medium">{s.car_plate}</td>
                  <td className="py-3 px-2 text-gray-500">{s.charger_name}</td>
                  <td className="py-3 px-2 text-gray-500">
                    {s.starting_car_percentage}% → {s.ending_car_percentage ?? "—"}%
                  </td>
                  <td className="py-3 px-2">{s.watt_consumed ? kw(s.watt_consumed) : "—"}</td>
                  <td className="py-3 px-2 font-semibold text-green-700">
                    {s.total_price ? rwf(s.total_price) : "—"}
                  </td>
                  <td className="py-3 px-2 text-gray-400 text-xs">
                    {new Date(s.started_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      s.ended_at ? "bg-gray-100 text-gray-500" : "bg-green-50 text-green-700 animate-pulse"
                    }`}>
                      {s.ended_at ? "Done / Byarangiye" : "Charging / Irasharija"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      ) : (
        // ── Shifts Table ──────────────────────────────────────────
        <Card>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="text-left border-b border-gray-100">
              <tr className="text-xs text-gray-400 uppercase tracking-wider">
                <th className="pb-3 px-2">Station / Sitasiyo</th>
                <th className="pb-3 px-2">Start / Itangira</th>
                <th className="pb-3 px-2">End / Iherezo</th>
                <th className="pb-3 px-2">Start Cashpower</th>
                <th className="pb-3 px-2">End Cashpower</th>
                <th className="pb-3 px-2">MoMo</th>
                <th className="pb-3 px-2">kW used / Zakoreshejwe</th>
                <th className="pb-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shifts.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No shifts / Nta zamu</td></tr>
              )}
              {shifts.map(sh => (
                <tr key={sh.id} className="text-sm">
                  <td className="py-3 px-2 font-medium">{sh.station_name}</td>
                  <td className="py-3 px-2 text-gray-400 text-xs">
                    {new Date(sh.shift_start).toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-gray-400 text-xs">
                    {sh.shift_end ? new Date(sh.shift_end).toLocaleString() : "—"}
                  </td>
                  <td className="py-3 px-2">{sh.start_kwatts_in_cashpower}</td>
                  <td className="py-3 px-2">{sh.end_kwatts_in_cashpower ?? "—"}</td>
                  <td className="py-3 px-2">{sh.money_on_momo ?? "—"}</td>
                  <td className="py-3 px-2 font-semibold text-green-700">
                    {sh.total_kwatt_used_on_shift ? `${sh.total_kwatt_used_on_shift} kWh` : "—"}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      sh.shift_end ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-500 animate-pulse"
                    }`}>
                      {sh.shift_end ? "Closed / Yafunzwe" : "Open / Ifunguye"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>
      )}
    </div>
  );
};