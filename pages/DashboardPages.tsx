import React, { useState } from "react";
import { Card, StatCard, Button, Input, Modal } from "../components/Shared";
import { useAdminReports, useAdminStations } from "../hooks/useAdmin";
import { useStaffDashboard, useShift, useSession, useStationChargers, useStations, useRegisterCar, type Car, type PortSide } from "../hooks/useStaff";

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
              value={`Rwf ${parseFloat(reports?.summary?.total_earnings || "0").toLocaleString()}`}
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
                            {info?.price_per_watt ? `Rwf ${info.price_per_watt}/W` : "—"}
                          </td>
                          <td className="py-3 px-2">{st.sessions}</td>
                          <td className="py-3 px-2 font-semibold text-blue-600">
                            Rwf {parseFloat(st.earnings || "0").toFixed(2)}
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
                      {st.price_per_watt ? `Rwf ${st.price_per_watt}/W` : "No rate"}
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
  const { openShift, setOpenShift, loading: shiftLoading, openShiftFn, addCashpowerFn, closeShiftFn } = useShift();
  const { activeSessions, loading: sessionsLoading, startSession, endSession } = useSession();
  const { chargers, loading: chargersLoading, refresh: refreshChargers } = useStationChargers();
  const { stations, loading: stationsLoading } = useStations();
  const { registerCar, searchCar, loading: carLoading } = useRegisterCar();

  const [stationId, setStationId] = useState("");
  const [cashpowerStartInput, setCashpowerStartInput] = useState("");
  const [cashpowerAddInput, setCashpowerAddInput] = useState("");
  const [moneyOnMomoInput, setMoneyOnMomoInput] = useState("");
  const [endCashpowerInput, setEndCashpowerInput] = useState("");
  const [shiftNotes, setShiftNotes] = useState("");
  const [wattInput, setWattInput] = useState<{ [key: number]: string }>({});
  const [endPctInput, setEndPctInput] = useState<{ [key: number]: string }>({});

  // ── New Charging Session modal ──────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [plateQuery, setPlateQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Car[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [chargerId, setChargerId] = useState("");
  const [selectedPort, setSelectedPort] = useState<PortSide | null>(null);
  const [startPctInput, setStartPctInput] = useState("");
  const [starting, setStarting] = useState(false);
  const [ownerNameInput, setOwnerNameInput] = useState("");
  const [carPhoneInput, setCarPhoneInput] = useState("");
  const [carInfoInput, setCarInfoInput] = useState("");
  const [registering, setRegistering] = useState(false);

  const selectedCharger = chargers.find(c => String(c.id) === chargerId) ?? null;

  // Type-ahead plate search (debounced) — skipped once a car is selected
  React.useEffect(() => {
    if (!modalOpen || selectedCar || !plateQuery.trim()) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(async () => {
      const results = await searchCar(plateQuery.trim());
      setSuggestions(results);
      setSearching(false);
    }, 250);
    return () => clearTimeout(timeout);
  }, [plateQuery, modalOpen, selectedCar]);

  // Sync open shift from dashboard data on load
  React.useEffect(() => {
    if (data?.open_shift) setOpenShift(data.open_shift);
  }, [data]);

  const handleOpenShift = async () => {
    if (!stationId || !cashpowerStartInput) return;
    const ok = await openShiftFn(parseInt(stationId), cashpowerStartInput, shiftNotes);
    if (ok) { setStationId(""); setCashpowerStartInput(""); setShiftNotes(""); refresh(); }
  };

  const handleAddCashpower = async () => {
    if (!openShift || !cashpowerAddInput) return;
    const ok = await addCashpowerFn(openShift.id, cashpowerAddInput);
    if (ok) setCashpowerAddInput("");
  };

  const handleCloseShift = async () => {
    if (!openShift || !moneyOnMomoInput || !endCashpowerInput) return;
    const ok = await closeShiftFn(openShift.id, moneyOnMomoInput, endCashpowerInput, shiftNotes);
    if (ok) { setMoneyOnMomoInput(""); setEndCashpowerInput(""); setShiftNotes(""); refresh(); }
  };

  const openModal = () => setModalOpen(true);

  const closeModal = () => {
    setModalOpen(false);
    setPlateQuery("");
    setSuggestions([]);
    setSelectedCar(null);
    setChargerId("");
    setSelectedPort(null);
    setStartPctInput("");
    setOwnerNameInput("");
    setCarPhoneInput("");
    setCarInfoInput("");
  };

  const handlePlateQueryChange = (value: string) => {
    setPlateQuery(value);
    if (selectedCar) setSelectedCar(null);
  };

  const handleSelectSuggestion = (car: Car) => {
    setSelectedCar(car);
    setPlateQuery(car.plate_number);
    setSuggestions([]);
  };

  const handleRegisterCar = async () => {
    if (!plateQuery.trim()) return;
    setRegistering(true);
    const car = await registerCar(
      plateQuery.trim().toUpperCase(),
      ownerNameInput || undefined,
      carPhoneInput || undefined,
      carInfoInput || undefined
    );
    setRegistering(false);
    if (car) {
      setSelectedCar(car);
      setPlateQuery(car.plate_number);
      setSuggestions([]);
    }
  };

  const handleChargerChange = (value: string) => {
    setChargerId(value);
    setSelectedPort(null);
  };

  const handleStart = async () => {
    if (!selectedCar || !chargerId || selectedPort === null || !startPctInput) return;
    setStarting(true);
    const ok = await startSession(parseInt(chargerId), selectedPort, selectedCar.plate_number, parseFloat(startPctInput));
    setStarting(false);
    if (ok) {
      closeModal();
      refreshChargers();
    }
  };

  const handleEnd = async (sessionId: number) => {
    const watt = wattInput[sessionId];
    const endPct = endPctInput[sessionId];
    if (!watt || !endPct) return;
    await endSession(sessionId, watt, parseFloat(endPct));
    setWattInput(prev => { const n = { ...prev }; delete n[sessionId]; return n; });
    setEndPctInput(prev => { const n = { ...prev }; delete n[sessionId]; return n; });
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
            value={`Rwf ${parseFloat(data.total_earnings || "0").toFixed(2)}`}
            icon="💵"
          />
          <StatCard label="Total Sessions" value={data.total_sessions ?? 0} icon="📅" />
        </div>
      )}

      {/* ── Shift Control ─────────────────────────────────────────── */}
      <Card title={openShift ? "Current Shift" : "Open New Shift"}>
        {!openShift ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
              {stationsLoading ? (
                <div className="w-full px-4 py-2 rounded-lg bg-gray-50 text-gray-400 text-sm animate-pulse">
                  Loading stations...
                </div>
              ) : (
                <select
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
                  value={stationId}
                  onChange={e => setStationId(e.target.value)}
                >
                  <option value="">Select station...</option>
                  {stations.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              )}
            </div>
            <Input
              label="Starting Cashpower"
              type="number"
              placeholder="e.g. 1250.50"
              value={cashpowerStartInput}
              onChange={e => setCashpowerStartInput(e.target.value)}
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
                disabled={shiftLoading || !stationId || !cashpowerStartInput}
              >
                {shiftLoading ? "Opening..." : "Open Shift"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {[
                ["Started",             new Date(openShift.shift_start).toLocaleTimeString()],
                ["Starting Cashpower",  openShift.start_kwatts_in_cashpower],
                ["Station",             openShift.station_name],
                ["Added Cashpower",     openShift.addition_kwatt_in_cashpower],
              ].map(([label, val]) => (
                <div key={String(label)} className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-400 uppercase tracking-wider mb-1">{label}</p>
                  <p className="font-semibold text-blue-800">{val}</p>
                </div>
              ))}
            </div>

            {/* Add cashpower mid-shift */}
            <div className="flex gap-3 items-end pt-3 border-t border-gray-100">
              <Input
                label="Add Cashpower"
                type="number"
                placeholder="e.g. 50.00"
                value={cashpowerAddInput}
                onChange={e => setCashpowerAddInput(e.target.value)}
              />
              <Button
                variant="secondary"
                onClick={handleAddCashpower}
                disabled={shiftLoading || !cashpowerAddInput}
                className="shrink-0"
              >
                Add
              </Button>
            </div>

            {/* Close shift */}
            <div className="flex gap-3 items-end pt-3 border-t border-gray-100">
              <Input
                label="Money on Momo"
                type="number"
                placeholder="e.g. 1380.00"
                value={moneyOnMomoInput}
                onChange={e => setMoneyOnMomoInput(e.target.value)}
              />
              <Input
                label="Ending Cashpower Reading"
                type="number"
                placeholder="e.g. 1250.50"
                value={endCashpowerInput}
                onChange={e => setEndCashpowerInput(e.target.value)}
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
                disabled={shiftLoading || !moneyOnMomoInput || !endCashpowerInput}
                className="shrink-0"
              >
                {shiftLoading ? "Closing..." : "Close Shift"}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Start Session Trigger ─────────────────────────────────── */}
      <div className="flex justify-between items-center bg-blue-600 text-white rounded-xl px-6 py-4">
        <div>
          <h3 className="font-bold text-lg">Start a Charging Session</h3>
          <p className="text-sm text-white/80">Search or register a car, then pick a charger port.</p>
        </div>
        <Button
          onClick={openModal}
          disabled={!openShift}
          className="bg-white !text-blue-600 font-bold hover:bg-gray-100 shrink-0"
        >
          {openShift ? "+ New Charging Session" : "Open a Shift First"}
        </Button>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title="New Charging Session">
        <div className="space-y-4">
          {/* ── Plate type-ahead ───────────────────────────────────── */}
          <div>
            <Input
              label="Car Plate Number"
              placeholder="Type to search..."
              value={plateQuery}
              onChange={e => handlePlateQueryChange(e.target.value)}
              autoFocus
            />
            {searching && <p className="text-xs text-gray-400 mt-1">Searching...</p>}
            {!selectedCar && suggestions.length > 0 && (
              <div className="mt-1 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto">
                {suggestions.map(car => (
                  <button
                    key={car.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(car)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <span className="font-semibold">{car.plate_number}</span>
                    {car.owner_name && <span className="text-gray-400 ml-2">{car.owner_name}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedCar && (
            <div className="p-3 bg-green-50 rounded-lg text-sm text-green-700">
              <span className="font-bold">✓ Selected:</span> {selectedCar.plate_number}
              {selectedCar.owner_name && <span className="ml-2">— {selectedCar.owner_name}</span>}
              {selectedCar.phone_number && <span className="ml-2">({selectedCar.phone_number})</span>}
            </div>
          )}

          {!selectedCar && !searching && plateQuery.trim() && suggestions.length === 0 && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <p className="text-sm font-medium text-gray-700">No matching car — register it:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  label="Owner Name (optional)"
                  value={ownerNameInput}
                  onChange={e => setOwnerNameInput(e.target.value)}
                />
                <Input
                  label="Owner Phone (optional)"
                  value={carPhoneInput}
                  onChange={e => setCarPhoneInput(e.target.value)}
                />
              </div>
              <Input
                label="Notes (optional)"
                value={carInfoInput}
                onChange={e => setCarInfoInput(e.target.value)}
              />
              <Button
                variant="secondary"
                onClick={handleRegisterCar}
                disabled={registering || carLoading}
              >
                {registering ? "Registering..." : `Register "${plateQuery.trim().toUpperCase()}"`}
              </Button>
            </div>
          )}

          {/* ── Charger + Port ─────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Charger</label>
            {chargersLoading ? (
              <div className="w-full px-4 py-2 rounded-lg bg-gray-50 text-gray-400 text-sm animate-pulse">
                Loading chargers...
              </div>
            ) : chargers.length === 0 ? (
              <div className="w-full px-4 py-2 rounded-lg bg-gray-50 text-gray-400 text-sm">
                No chargers at your station
              </div>
            ) : (
              <select
                className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
                value={chargerId}
                onChange={e => handleChargerChange(e.target.value)}
              >
                <option value="">Choose charger...</option>
                {chargers.map(c => {
                  const freePorts = c.ports.filter(p => p.available).length;
                  return (
                    <option key={c.id} value={c.id} disabled={freePorts === 0}>
                      {c.name} — {freePorts}/{c.ports.length} ports free
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {selectedCharger && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
              <div className="flex gap-2">
                {selectedCharger.ports.map(p => (
                  <button
                    key={p.port}
                    type="button"
                    disabled={!p.available}
                    onClick={() => setSelectedPort(p.port)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      selectedPort === p.port
                        ? "bg-blue-600 text-white border-blue-600"
                        : p.available
                        ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                        : "border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed"
                    }`}
                  >
                    {p.port === "left" ? "Left" : "Right"} Port {p.available ? "— Available 🟢" : "— In Use 🔴"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Input
            label="Starting Car %"
            type="number"
            min={0}
            max={100}
            placeholder="e.g. 20"
            value={startPctInput}
            onChange={e => setStartPctInput(e.target.value)}
          />

          <Button
            className="w-full"
            onClick={handleStart}
            disabled={!selectedCar || !chargerId || selectedPort === null || !startPctInput || starting}
          >
            {starting ? "Starting..." : "Start Session"}
          </Button>
        </div>
      </Modal>

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
                    <p className="text-sm text-gray-500">
                      {session.charger_name} · {session.port === "left" ? "Left" : "Right"} Port
                    </p>
                    <p className="text-xs text-gray-400">
                      Started: {new Date(session.started_at).toLocaleTimeString()} · {session.starting_car_percentage}%
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
                  <Input
                    label="Ending Car %"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="e.g. 90"
                    value={endPctInput[session.id] || ""}
                    onChange={e => setEndPctInput({ ...endPctInput, [session.id]: e.target.value })}
                  />
                  <Button
                    className="w-full"
                    onClick={() => handleEnd(session.id)}
                    disabled={!wattInput[session.id] || !endPctInput[session.id]}
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