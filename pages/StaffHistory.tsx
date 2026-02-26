import React, { useState } from "react";
import { Card } from "../components/Shared";
import { useStaffHistory } from "../hooks/useStaff";

export const StaffHistory: React.FC = () => {
  const { sessions, shifts, loading } = useStaffHistory();
  const [tab, setTab] = useState<"sessions" | "shifts">("sessions");

  const completed = sessions.filter(s => s.ended_at !== null);
  const totalEarnings = completed.reduce((sum, s) => sum + parseFloat(s.total_price || "0"), 0);
  const totalWatt = completed.reduce((sum, s) => sum + parseFloat(s.watt_consumed || "0"), 0);
  const totalKwh = shifts.reduce((sum, s) => sum + parseFloat(s.kwh_consumed || "0"), 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My History</h2>

      {/* ── Summary ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Sessions</p>
          <p className="text-2xl font-bold">{completed.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Earnings</p>
          <p className="text-2xl font-bold text-blue-600">${totalEarnings.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Watts Consumed</p>
          <p className="text-2xl font-bold">{totalWatt.toLocaleString()}W</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">kWh (shifts)</p>
          <p className="text-2xl font-bold">{totalKwh.toFixed(2)} kWh</p>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-gray-200">
        {(["sessions", "shifts"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading history...</div>
      ) : tab === "sessions" ? (
        // ── Sessions Table ────────────────────────────────────────
        <Card>
          <table className="w-full">
            <thead className="text-left border-b border-gray-100">
              <tr className="text-xs text-gray-400 uppercase tracking-wider">
                <th className="pb-3 px-2">Plate</th>
                <th className="pb-3 px-2">Charger</th>
                <th className="pb-3 px-2">Watts</th>
                <th className="pb-3 px-2">Price</th>
                <th className="pb-3 px-2">Started</th>
                <th className="pb-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sessions.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No sessions yet</td></tr>
              )}
              {sessions.map(s => (
                <tr key={s.id} className="text-sm">
                  <td className="py-3 px-2 font-medium">{s.car_plate}</td>
                  <td className="py-3 px-2 text-gray-500">{s.charger_name}</td>
                  <td className="py-3 px-2">{s.watt_consumed ? `${s.watt_consumed}W` : "—"}</td>
                  <td className="py-3 px-2 font-semibold text-blue-600">
                    {s.total_price ? `$${parseFloat(s.total_price).toFixed(2)}` : "—"}
                  </td>
                  <td className="py-3 px-2 text-gray-400 text-xs">
                    {new Date(s.started_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      s.ended_at ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600 animate-pulse"
                    }`}>
                      {s.ended_at ? "Done" : "Active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        // ── Shifts Table ──────────────────────────────────────────
        <Card>
          <table className="w-full">
            <thead className="text-left border-b border-gray-100">
              <tr className="text-xs text-gray-400 uppercase tracking-wider">
                <th className="pb-3 px-2">Station</th>
                <th className="pb-3 px-2">Start</th>
                <th className="pb-3 px-2">End</th>
                <th className="pb-3 px-2">kWh Start</th>
                <th className="pb-3 px-2">kWh End</th>
                <th className="pb-3 px-2">Consumed</th>
                <th className="pb-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shifts.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No shifts yet</td></tr>
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
                  <td className="py-3 px-2">{sh.kwh_start}</td>
                  <td className="py-3 px-2">{sh.kwh_end ?? "—"}</td>
                  <td className="py-3 px-2 font-semibold text-blue-600">
                    {sh.kwh_consumed ? `${sh.kwh_consumed} kWh` : "—"}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      sh.shift_end ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-500 animate-pulse"
                    }`}>
                      {sh.shift_end ? "Closed" : "Open"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
};