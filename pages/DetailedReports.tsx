import React, { useEffect, useState } from "react";
import { Card, Button, Input, Select, TableSkeleton } from "../components/Shared";
import { IconExport } from "../components/Icons";
import { rwf, kw } from "../utils/format";
import { useStations } from "../hooks/useStaff";
import { type Employee } from "../hooks/useAdmin";
import { useSessionReport, useShiftReport, type ReportFilters } from "../hooks/useReports";

// Embeddable detailed-report panel: data loads automatically as filters change,
// and the same filtered slice can be downloaded as Excel or PDF.
export const ReportPanel: React.FC<{
  type: "sessions" | "shifts";
  isAdmin: boolean;
  employees?: Employee[];
}> = ({ type, isAdmin, employees = [] }) => {
  const { stations } = useStations();
  const sessionReport = useSessionReport();
  const shiftReport = useShiftReport();

  const [staffId, setStaffId] = useState("");
  const [stationId, setStationId] = useState("");
  const [chargerId, setChargerId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const buildFilters = (): ReportFilters => ({
    staff: isAdmin && staffId ? parseInt(staffId) : undefined,
    station: stationId ? parseInt(stationId) : undefined,
    charger: type === "sessions" && chargerId ? parseInt(chargerId) : undefined,
    shift: type === "sessions" && shiftId ? parseInt(shiftId) : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const active = type === "sessions" ? sessionReport : shiftReport;

  // Auto-load: fetch on mount and whenever a filter changes (debounced so
  // typing a charger/shift id doesn't fire a request per keystroke).
  useEffect(() => {
    const timeout = setTimeout(() => {
      active.fetchReport(buildFilters());
    }, 350);
    return () => clearTimeout(timeout);
  }, [type, staffId, stationId, chargerId, shiftId, dateFrom, dateTo]);

  const handleExcel = () => active.downloadExcel(buildFilters());
  const handlePdf = () => active.downloadPdf(buildFilters());

  return (
    <div className="space-y-4">

      {/* ── Filters + downloads ───────────────────────────────────── */}
      <Card
        title="Filters / Shungura"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExcel} className="!px-3">
              <IconExport className="w-4 h-4" /> Excel
            </Button>
            <Button variant="secondary" onClick={handlePdf} className="!px-3">
              <IconExport className="w-4 h-4" /> PDF
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isAdmin && (
            <Select label="Staff / Umukozi" value={staffId} onChange={e => setStaffId(e.target.value)}>
              <option value="">All / Bose</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </Select>
          )}
          <Select label="Station / Sitasiyo" value={stationId} onChange={e => setStationId(e.target.value)}>
            <option value="">All / Zose</option>
            {stations.map(st => (
              <option key={st.id} value={st.id}>{st.name}</option>
            ))}
          </Select>
          {type === "sessions" && (
            <>
              <Input
                label="Charger ID (si ngombwa)"
                type="number"
                placeholder="urugero: 3"
                value={chargerId}
                onChange={e => setChargerId(e.target.value)}
              />
              <Input
                label="Shift ID / Zamu ID (si ngombwa)"
                type="number"
                placeholder="urugero: 12"
                value={shiftId}
                onChange={e => setShiftId(e.target.value)}
              />
            </>
          )}
          <Input
            label="From / Kuva"
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
          <Input
            label="To / Kugeza"
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />
        </div>
      </Card>

      {/* ── Results — skeleton on first load, reduced opacity on refetch ── */}
      {active.loading && active.rows.length === 0 ? (
        <Card><TableSkeleton rows={6} cols={7} /></Card>
      ) : (
      <div className={active.loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
      {type === "sessions" ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="text-left border-b border-gray-100">
                <tr className="text-xs text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 px-2">Staff / Umukozi</th>
                  <th className="pb-3 px-2">Station / Sitasiyo</th>
                  <th className="pb-3 px-2">Charger</th>
                  <th className="pb-3 px-2">Plate / Plaque</th>
                  <th className="pb-3 px-2">Battery / Batiri</th>
                  <th className="pb-3 px-2">kW</th>
                  <th className="pb-3 px-2">Time / Igihe</th>
                  <th className="pb-3 px-2">Paid / Yishyuye</th>
                  <th className="pb-3 px-2">Start / Itangira</th>
                  <th className="pb-3 px-2">End / Iherezo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sessionReport.rows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-gray-400">
                      {sessionReport.loading ? "Tegereza..." : "No data / Nta makuru"}
                    </td>
                  </tr>
                )}
                {sessionReport.rows.map((r, i) => (
                  <tr key={i} className="text-sm">
                    <td className="py-3 px-2 font-medium">{r.staff_name}</td>
                    <td className="py-3 px-2 text-gray-500">{r.station_name}</td>
                    <td className="py-3 px-2 text-gray-500">{r.charger_name}</td>
                    <td className="py-3 px-2">{r.car_plate}</td>
                    <td className="py-3 px-2 text-gray-500">
                      {r.starting_car_percentage}% → {r.ending_car_percentage ?? "—"}%
                    </td>
                    <td className="py-3 px-2">
                      <span className="inline-flex items-center gap-1.5">
                        {r.watt_consumed ? kw(r.watt_consumed) : "—"}
                        {r.is_estimated && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-50 text-amber-600" title="Estimated after power outage">
                            Est.
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-500">{r.duration ?? "—"}</td>
                    <td className="py-3 px-2 font-semibold text-green-700">
                      {r.total_price ? rwf(r.total_price) : "—"}
                    </td>
                    <td className="py-3 px-2 text-gray-400 text-xs">
                      {new Date(r.started_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-gray-400 text-xs">
                      {r.ended_at ? new Date(r.ended_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="text-left border-b border-gray-100">
                <tr className="text-xs text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 px-2">Staff / Umukozi</th>
                  <th className="pb-3 px-2">Station / Sitasiyo</th>
                  <th className="pb-3 px-2">Start / Itangira</th>
                  <th className="pb-3 px-2">End / Iherezo</th>
                  <th className="pb-3 px-2">Start Cashpower</th>
                  <th className="pb-3 px-2">End Cashpower</th>
                  <th className="pb-3 px-2">Added / Yongewe</th>
                  <th className="pb-3 px-2">kW used / Zakoreshejwe</th>
                  <th className="pb-3 px-2">Earned / Ayinjiye</th>
                  <th className="pb-3 px-2">MoMo</th>
                  <th className="pb-3 px-2">Cars / Imodoka</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {shiftReport.rows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-gray-400">
                      {shiftReport.loading ? "Tegereza..." : "No data / Nta makuru"}
                    </td>
                  </tr>
                )}
                {shiftReport.rows.map((sh, i) => (
                  <tr key={i} className="text-sm">
                    <td className="py-3 px-2 font-medium">{sh.staff_name}</td>
                    <td className="py-3 px-2 text-gray-500">{sh.station_name}</td>
                    <td className="py-3 px-2 text-gray-400 text-xs">
                      {new Date(sh.shift_start).toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-gray-400 text-xs">
                      {sh.shift_end ? new Date(sh.shift_end).toLocaleString() : "—"}
                    </td>
                    <td className="py-3 px-2">{sh.start_kwatts_in_cashpower}</td>
                    <td className="py-3 px-2">{sh.end_kwatts_in_cashpower ?? "—"}</td>
                    <td className="py-3 px-2">{sh.addition_kwatt_in_cashpower}</td>
                    <td className="py-3 px-2">
                      {sh.total_kwatt_used_on_shift ? `${sh.total_kwatt_used_on_shift} kWh` : "—"}
                    </td>
                    <td className="py-3 px-2 font-semibold text-green-700">
                      {sh.total_earned_money_on_shift ? rwf(sh.total_earned_money_on_shift) : "—"}
                    </td>
                    <td className="py-3 px-2">{sh.money_on_momo ?? "—"}</td>
                    <td className="py-3 px-2">{sh.total_car_charged ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      </div>
      )}
    </div>
  );
};
