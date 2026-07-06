import React, { useState } from "react";
import { Card, Button, Input } from "../components/Shared";
import { useStations } from "../hooks/useStaff";
import { useAdminEmployees, type Employee } from "../hooks/useAdmin";
import { useSessionReport, useShiftReport, type ReportFilters } from "../hooks/useReports";

const ReportsPanel: React.FC<{ isAdmin: boolean; employees: Employee[] }> = ({ isAdmin, employees }) => {
  const { stations } = useStations();
  const sessionReport = useSessionReport();
  const shiftReport = useShiftReport();

  const [tab, setTab] = useState<"sessions" | "shifts">("sessions");
  const [staffId, setStaffId] = useState("");
  const [stationId, setStationId] = useState("");
  const [chargerId, setChargerId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const buildFilters = (): ReportFilters => ({
    staff: isAdmin && staffId ? parseInt(staffId) : undefined,
    station: stationId ? parseInt(stationId) : undefined,
    charger: tab === "sessions" && chargerId ? parseInt(chargerId) : undefined,
    shift: tab === "sessions" && shiftId ? parseInt(shiftId) : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const active = tab === "sessions" ? sessionReport : shiftReport;

  const handleLoad = () => active.fetchReport(buildFilters());
  const handleExcel = () => active.downloadExcel(buildFilters());
  const handlePdf = () => active.downloadPdf(buildFilters());

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Detailed Reports</h2>

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-gray-200">
        {(["sessions", "shifts"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t === "sessions" ? "Sessions" : "Shifts"}
          </button>
        ))}
      </div>

      {/* ── Filters ───────────────────────────────────────────────── */}
      <Card title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Staff</label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
                value={staffId}
                onChange={e => setStaffId(e.target.value)}
              >
                <option value="">All Staff</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
            <select
              className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
              value={stationId}
              onChange={e => setStationId(e.target.value)}
            >
              <option value="">All Stations</option>
              {stations.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>
          {tab === "sessions" && (
            <>
              <Input
                label="Charger ID (optional)"
                type="number"
                placeholder="e.g. 3"
                value={chargerId}
                onChange={e => setChargerId(e.target.value)}
              />
              <Input
                label="Shift ID (optional)"
                type="number"
                placeholder="e.g. 12"
                value={shiftId}
                onChange={e => setShiftId(e.target.value)}
              />
            </>
          )}
          <Input
            label="Date From"
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
          <Input
            label="Date To"
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button onClick={handleLoad} disabled={active.loading}>
            {active.loading ? "Loading..." : "Load Report"}
          </Button>
          <Button variant="secondary" onClick={handleExcel}>Download Excel</Button>
          <Button variant="secondary" onClick={handlePdf}>Download PDF</Button>
        </div>
      </Card>

      {/* ── Results ───────────────────────────────────────────────── */}
      {tab === "sessions" ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-left border-b border-gray-100">
                <tr className="text-xs text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 px-2">Staff</th>
                  <th className="pb-3 px-2">Station</th>
                  <th className="pb-3 px-2">Charger</th>
                  <th className="pb-3 px-2">Port</th>
                  <th className="pb-3 px-2">Plate</th>
                  <th className="pb-3 px-2">Battery</th>
                  <th className="pb-3 px-2">Watts</th>
                  <th className="pb-3 px-2">Duration</th>
                  <th className="pb-3 px-2">Paid</th>
                  <th className="pb-3 px-2">Started</th>
                  <th className="pb-3 px-2">Ended</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sessionReport.rows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-gray-400">
                      No data — adjust filters and click Load Report
                    </td>
                  </tr>
                )}
                {sessionReport.rows.map((r, i) => (
                  <tr key={i} className="text-sm">
                    <td className="py-3 px-2 font-medium">{r.staff_name}</td>
                    <td className="py-3 px-2 text-gray-500">{r.station_name}</td>
                    <td className="py-3 px-2 text-gray-500">{r.charger_name}</td>
                    <td className="py-3 px-2 text-gray-500">{r.port === "left" ? "Left" : "Right"}</td>
                    <td className="py-3 px-2">{r.car_plate}</td>
                    <td className="py-3 px-2 text-gray-500">
                      {r.starting_car_percentage}% → {r.ending_car_percentage ?? "—"}%
                    </td>
                    <td className="py-3 px-2">{r.watt_consumed ? `${r.watt_consumed}W` : "—"}</td>
                    <td className="py-3 px-2 text-gray-500">{r.duration ?? "—"}</td>
                    <td className="py-3 px-2 font-semibold text-blue-600">
                      {r.total_price ? `Rwf ${parseFloat(r.total_price).toFixed(2)}` : "—"}
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
            <table className="w-full">
              <thead className="text-left border-b border-gray-100">
                <tr className="text-xs text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 px-2">Staff</th>
                  <th className="pb-3 px-2">Station</th>
                  <th className="pb-3 px-2">Start</th>
                  <th className="pb-3 px-2">End</th>
                  <th className="pb-3 px-2">Start Cashpower</th>
                  <th className="pb-3 px-2">End Cashpower</th>
                  <th className="pb-3 px-2">Added</th>
                  <th className="pb-3 px-2">Consumed</th>
                  <th className="pb-3 px-2">Earned</th>
                  <th className="pb-3 px-2">Money on Momo</th>
                  <th className="pb-3 px-2">Cars Charged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {shiftReport.rows.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-gray-400">
                      No data — adjust filters and click Load Report
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
                    <td className="py-3 px-2 font-semibold text-blue-600">
                      {sh.total_earned_money_on_shift ? `Rwf ${parseFloat(sh.total_earned_money_on_shift).toFixed(2)}` : "—"}
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
  );
};

export const AdminDetailedReports: React.FC = () => {
  const { employees } = useAdminEmployees();
  return <ReportsPanel isAdmin employees={employees} />;
};

export const StaffDetailedReports: React.FC = () => {
  return <ReportsPanel isAdmin={false} employees={[]} />;
};
