import React, { useState } from "react";
import { Card, StatCard, Button, Input } from "../components/Shared";
import { useAdminReports, useAdminStations } from "../hooks/useAdmin";
import { useStaffDashboard, useShift, useSession, useStationChargers } from "../hooks/useStaff";

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────

export const AdminDashboard: React.FC = () => {
  const { reports, loading: rLoading } = useAdminReports();
  const { stations, loading: sLoading } = useAdminStations();

  const loading = rLoading || sLoading;
  const perStation: any[] = Array.isArray(reports?.per_station) ? reports.per_station : [];

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Earnings"
              value={`$${parseFloat(reports?.summary?.total_earnings || "0").toLocaleString()}`}
              icon="💰"
            />
            <StatCard
              label="Watts Consumed"
              value={`${parseFloat(reports?.summary?.total_watt || "0").toLocaleString()}W`}
              icon="⚡"
            />
            <StatCard
              label="Total Sessions"
              value={reports?.summary?.total_sessions ?? 0}
              icon="🔌"
            />
            <StatCard label="Total Stations" value={stations.length} icon="🏠" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Earnings per Station">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="text-left border-b border-gray-100">
                    <tr className="text-xs text-gray-400 uppercase tracking-wider">
                      <th className="pb-3 px-2">Station</th>
                      <th className="pb-3 px-2">Rate</th>
                      <th className="pb-3 px-2">Sessions</th>
                      <th className="pb-3 px-2">Earnings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {perStation.map((st: any) => {
                      const info = stations.find(s => s.id === st.station__id);
                      return (
                        <tr key={st.station__id} className="text-sm">
                          <td className="py-3 px-2 font-medium">{st.station__name}</td>
                          <td className="py-3 px-2 text-gray-500">
                            {info?.price_per_watt ? `$${info.price_per_watt}/W` : "—"}
                          </td>
                          <td className="py-3 px-2">{st.sessions}</td>
                          <td className="py-3 px-2 font-semibold text-blue-600">
                            ${parseFloat(st.earnings || "0").toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    {perStation.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-gray-400">No session data yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="All Stations">
              <div className="space-y-3">
                {stations.length === 0 && (
                  <p className="text-center text-gray-400 py-4">No stations yet</p>
                )}
                {stations.map(st => (
                  <div key={st.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{st.name}</p>
                      <p className="text-xs text-gray-400">
                        Created: {new Date(st.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-blue-600">
                      {st.price_per_watt ? `$${st.price_per_watt}/W` : "No rate"}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

// ─── STAFF DASHBOARD ──────────────────────────────────────────────────────────

export const StaffDashboard: React.FC = () => {
  const { data, loading: dashLoading, refresh } = useStaffDashboard();
  const { openShift, setOpenShift, loading: shiftLoading, openShiftFn, closeShiftFn } = useShift();
  const { activeSessions, loading: sessionsLoading, startSession, endSession } = useSession();
  const { chargers, loading: chargersLoading } = useStationChargers();

  const [kwhStartInput, setKwhStartInput] = useState("");
  const [kwhEndInput, setKwhEndInput] = useState("");
  const [shiftNotes, setShiftNotes] = useState("");
  const [plate, setPlate] = useState("");
  const [chargerId, setChargerId] = useState("");
  const [starting, setStarting] = useState(false);
  const [wattInput, setWattInput] = useState<{ [key: number]: string }>({});

  const busyChargerIds = new Set(activeSessions.map(s => s.charger));

  // Sync open shift from dashboard data on load
  React.useEffect(() => {
    if (data?.open_shift) setOpenShift(data.open_shift);
  }, [data]);

  const handleOpenShift = async () => {
    if (!kwhStartInput) return;
    const ok = await openShiftFn(kwhStartInput, shiftNotes);
    if (ok) { setKwhStartInput(""); setShiftNotes(""); refresh(); }
  };

  const handleCloseShift = async () => {
    if (!openShift || !kwhEndInput) return;
    const ok = await closeShiftFn(openShift.id, kwhEndInput, shiftNotes);
    if (ok) { setKwhEndInput(""); setShiftNotes(""); refresh(); }
  };

  const handleStart = async () => {
    if (!plate.trim() || !chargerId) return;
    setStarting(true);
    await startSession(parseInt(chargerId), plate.toUpperCase());
    setStarting(false);
    setPlate("");
    setChargerId("");
  };

  const handleEnd = async (sessionId: number) => {
    const watt = wattInput[sessionId];
    if (!watt) return;
    await endSession(sessionId, watt);
    setWattInput(prev => { const n = { ...prev }; delete n[sessionId]; return n; });
  };

  if (dashLoading) return <div className="text-center py-20 text-gray-400">Loading dashboard...</div>;

  return (
    <div className="space-y-6">

      {/* ── Station Summary ───────────────────────────────────────── */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Station" value={data.station.name} icon="⛽" />
          <StatCard label="Chargers" value={data.charger_count} icon="🔌" />
          <StatCard
            label="Total Earnings"
            value={`$${parseFloat(data.total_earnings || "0").toFixed(2)}`}
            icon="💵"
          />
          <StatCard label="Total Sessions" value={data.total_sessions ?? 0} icon="📅" />
        </div>
      )}

      {/* ── Shift Control ─────────────────────────────────────────── */}
      <Card title={openShift ? "Close Current Shift" : "Open New Shift"}>
        {!openShift ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Starting kWh Reading"
              type="number"
              placeholder="e.g. 1250.50"
              value={kwhStartInput}
              onChange={e => setKwhStartInput(e.target.value)}
            />
            <Input
              label="Notes (optional)"
              placeholder="Shift notes..."
              value={shiftNotes}
              onChange={e => setShiftNotes(e.target.value)}
            />
            <div className="flex items-end">
              <Button
                className="w-full"
                onClick={handleOpenShift}
                disabled={shiftLoading || !kwhStartInput}
              >
                {shiftLoading ? "Opening..." : "Open Shift"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {[
                ["Started",    new Date(openShift.shift_start).toLocaleTimeString()],
                ["Start kWh", openShift.kwh_start],
                ["Station",   openShift.station_name],
                ["Notes",     openShift.notes || "—"],
              ].map(([label, val]) => (
                <div key={String(label)} className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-400 uppercase tracking-wider mb-1">{label}</p>
                  <p className="font-semibold text-blue-800">{val}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 items-end">
              <Input
                label="Ending kWh Reading"
                type="number"
                placeholder="e.g. 1380.00"
                value={kwhEndInput}
                onChange={e => setKwhEndInput(e.target.value)}
              />
              <Input
                label="Closing Notes (optional)"
                placeholder="Any notes..."
                value={shiftNotes}
                onChange={e => setShiftNotes(e.target.value)}
              />
              <Button
                variant="danger"
                onClick={handleCloseShift}
                disabled={shiftLoading || !kwhEndInput}
                className="shrink-0"
              >
                {shiftLoading ? "Closing..." : "Close Shift"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Start Session Form ────────────────────────────────────── */}
      <Card title="Start New Charging Session" className="bg-blue-600 text-white border-none">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Car Plate Number"
            placeholder="ABC-123"
            value={plate}
            onChange={e => setPlate(e.target.value)}
            className="bg-white text-gray-900"
          />
          <div className="w-full">
            <label className="block text-sm font-medium mb-1 text-white">Select Charger</label>
            {chargersLoading ? (
              <div className="w-full px-4 py-2 rounded-lg bg-white/20 text-white/80 text-sm animate-pulse">
                Loading chargers...
              </div>
            ) : chargers.length === 0 ? (
              <div className="w-full px-4 py-2 rounded-lg bg-white/20 text-white/80 text-sm">
                No chargers at your station
              </div>
            ) : (
              <select
                className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-900 bg-white outline-none focus:ring-2 focus:ring-blue-300"
                value={chargerId}
                onChange={e => setChargerId(e.target.value)}
              >
                <option value="">Choose charger...</option>
                {chargers.map(c => {
                  const inUse = busyChargerIds.has(c.id);
                  return (
                    <option key={c.id} value={c.id} disabled={inUse}>
                      {c.name}{inUse ? " — In Use 🔴" : " — Available 🟢"}
                    </option>
                  );
                })}
              </select>
            )}
            {chargerId && busyChargerIds.has(parseInt(chargerId)) && (
              <p className="text-yellow-200 text-xs mt-1 font-medium">
                ⚠ This charger is currently in use.
              </p>
            )}
          </div>
          <div className="flex items-end">
            <Button
              className="w-full h-[42px] bg-white !text-blue-600 font-bold hover:bg-gray-100"
              onClick={handleStart}
              disabled={
                !plate.trim() || !chargerId || starting ||
                busyChargerIds.has(parseInt(chargerId)) ||
                !openShift  // must have an open shift to start session
              }
            >
              {starting ? "Starting..." : !openShift ? "Open a Shift First" : "Start Session"}
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Active Sessions ───────────────────────────────────────── */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🔌</span> Active Sessions
          {sessionsLoading && <span className="text-sm font-normal text-gray-400">Loading...</span>}
        </h3>
        {activeSessions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
            No active sessions.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map(session => (
              <Card key={session.id}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg">{session.car_plate}</h4>
                    <p className="text-sm text-gray-500">{session.charger_name}</p>
                    <p className="text-xs text-gray-400">
                      Started: {new Date(session.started_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                    CHARGING
                  </span>
                </div>
                <div className="space-y-3">
                  <Input
                    label="Watt Consumed"
                    type="number"
                    placeholder="Enter watts used..."
                    value={wattInput[session.id] || ""}
                    onChange={e => setWattInput({ ...wattInput, [session.id]: e.target.value })}
                  />
                  <Button
                    className="w-full"
                    onClick={() => handleEnd(session.id)}
                    disabled={!wattInput[session.id]}
                  >
                    End & Calculate Price
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};