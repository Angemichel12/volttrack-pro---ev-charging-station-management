import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Button, Input, Select, Modal, PageHeader, EmptyState, Loading, Badge } from "../components/Shared";
import { IconBolt, IconCharger, IconPlus, IconCheck, IconClock, IconBattery, IconShift, IconMoney } from "../components/Icons";
import { rwf, kw } from "../utils/format";
import { useStaffDashboard, useSession, useStationChargers, useRegisterCar, type Car, type Session } from "../hooks/useStaff";

// The staff working screen: start charging sessions and end the active ones.
// Requires an open shift — otherwise points back to the shift page.
export const StaffSessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading: dashLoading } = useStaffDashboard();
  const { activeSessions, loading: sessionsLoading, startSession, endSession } = useSession();
  const { chargers, loading: chargersLoading, refresh: refreshChargers } = useStationChargers();
  const { registerCar, searchCar, loading: carLoading } = useRegisterCar();

  const [wattInput, setWattInput] = useState<{ [key: number]: string }>({});
  const [endPctInput, setEndPctInput] = useState<{ [key: number]: string }>({});
  const [endingId, setEndingId] = useState<number | null>(null);
  const [endedSession, setEndedSession] = useState<Session | null>(null);

  // ── New Charging Session modal ──────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [plateQuery, setPlateQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Car[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [chargerId, setChargerId] = useState("");
  const [startPctInput, setStartPctInput] = useState("");
  const [starting, setStarting] = useState(false);
  const [ownerNameInput, setOwnerNameInput] = useState("");
  const [carPhoneInput, setCarPhoneInput] = useState("");
  const [carInfoInput, setCarInfoInput] = useState("");
  const [registering, setRegistering] = useState(false);

  const openShift = data?.open_shift ?? null;
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

  const closeModal = () => {
    setModalOpen(false);
    setPlateQuery("");
    setSuggestions([]);
    setSelectedCar(null);
    setChargerId("");
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

  const handleStart = async () => {
    // The backend tracks two slots per charger — pick the first free one
    // automatically so staff never deal with ports.
    const freePort = selectedCharger?.ports.find(p => p.available)?.port;
    if (!selectedCar || !chargerId || !freePort || !startPctInput) return;
    setStarting(true);
    const ok = await startSession(parseInt(chargerId), freePort, selectedCar.plate_number, parseFloat(startPctInput));
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
    setEndingId(sessionId);
    const ended = await endSession(sessionId, watt, parseFloat(endPct));
    setEndingId(null);
    if (!ended) return;
    setWattInput(prev => { const n = { ...prev }; delete n[sessionId]; return n; });
    setEndPctInput(prev => { const n = { ...prev }; delete n[sessionId]; return n; });
    setEndedSession(ended); // show the calculated price in a popup
    refreshChargers();
  };

  if (dashLoading) return <Loading label="Loading sessions..." />;

  // ── No open shift — can't charge yet ───────────────────────────
  if (!openShift) {
    return (
      <div className="space-y-6">
        <PageHeader title="Charging Sessions" subtitle="Start and manage car charging" />
        <EmptyState
          icon={<IconShift className="w-6 h-6" />}
          title="No open shift"
          hint="You need to open a shift before you can start charging sessions."
          action={
            <Button onClick={() => navigate("/staff/shift")}>
              Open a Shift
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <PageHeader
        title="Charging Sessions"
        subtitle={`${data!.station.name} · ${data!.charger_count} charger${data!.charger_count === 1 ? "" : "s"}`}
        actions={<Badge tone="green" pulse>Shift open</Badge>}
      />

      {/* ── Start Session banner ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-2xl px-5 sm:px-6 py-5 shadow-sm">
        <div>
          <h3 className="font-bold text-lg">Start a Charging Session</h3>
          <p className="text-sm text-white/80 mt-0.5">Search or register a car, then pick an available charger.</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="!bg-white !text-green-800 font-bold hover:!bg-green-50 shrink-0 w-full sm:w-auto"
        >
          <IconPlus className="w-4 h-4" /> New Charging Session
        </Button>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title="New Charging Session">
        <div className="space-y-4">
          {/* ── Step 1: the car ────────────────────────────────────── */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Step 1 · Car</p>
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
              <div className="mt-1 border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-40 overflow-y-auto shadow-sm">
                {suggestions.map(car => (
                  <button
                    key={car.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(car)}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-green-50/60 transition-colors"
                  >
                    <span className="font-semibold">{car.plate_number}</span>
                    {car.owner_name && <span className="text-gray-400 ml-2">{car.owner_name}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedCar && (
            <div className="flex items-start gap-2 p-3 bg-green-50 rounded-xl text-sm text-green-800">
              <IconCheck className="w-4 h-4 mt-0.5 shrink-0" />
              <p>
                <span className="font-bold">{selectedCar.plate_number}</span>
                {selectedCar.owner_name && <span className="ml-2">— {selectedCar.owner_name}</span>}
                {selectedCar.phone_number && <span className="ml-2 text-green-700/70">({selectedCar.phone_number})</span>}
              </p>
            </div>
          )}

          {!selectedCar && !searching && plateQuery.trim() && suggestions.length === 0 && (
            <div className="p-4 bg-gray-50 rounded-xl space-y-3">
              <p className="text-sm font-medium text-gray-700">New car — register it first:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                className="w-full sm:w-auto"
              >
                {registering ? "Registering..." : `Register "${plateQuery.trim().toUpperCase()}"`}
              </Button>
            </div>
          )}

          {/* ── Step 2: charger — full when charging 2 cars ────────── */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-2">Step 2 · Charger</p>
          <div>
            {chargersLoading ? (
              <div className="w-full px-4 py-2.5 rounded-xl bg-gray-50 text-gray-400 text-sm animate-pulse">
                Loading chargers...
              </div>
            ) : chargers.length === 0 ? (
              <div className="w-full px-4 py-2.5 rounded-xl bg-gray-50 text-gray-400 text-sm">
                No chargers at your station
              </div>
            ) : (
              <Select label="Charger" value={chargerId} onChange={e => setChargerId(e.target.value)}>
                <option value="">Choose charger...</option>
                {chargers.map(c => {
                  const carsCharging = c.ports.filter(p => !p.available).length;
                  const full = carsCharging >= c.ports.length;
                  return (
                    <option key={c.id} value={c.id} disabled={full}>
                      {c.name} — {full ? "Full" : carsCharging > 0 ? `${carsCharging} car charging` : "Available"}
                    </option>
                  );
                })}
              </Select>
            )}
          </div>

          {/* ── Step 3: battery + start ────────────────────────────── */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-2">Step 3 · Battery</p>
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
            className="w-full py-3"
            onClick={handleStart}
            disabled={!selectedCar || !chargerId || !startPctInput || starting}
          >
            <IconBolt className="w-4 h-4" />
            {starting ? "Starting..." : "Start Session"}
          </Button>
        </div>
      </Modal>

      {/* ── Active Sessions ───────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Active Sessions</h3>
          {activeSessions.length > 0 && <Badge tone="green" pulse>{activeSessions.length} charging</Badge>}
          {sessionsLoading && <span className="text-sm font-normal text-gray-400">Loading...</span>}
        </div>
        {activeSessions.length === 0 ? (
          <EmptyState
            icon={<IconCharger className="w-6 h-6" />}
            title="No cars charging right now"
            hint="Start a session above when a car arrives."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map(session => (
              <Card key={session.id}>
                <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0">
                    <h4 className="font-bold text-lg text-gray-900 truncate">{session.car_plate}</h4>
                    <p className="text-sm text-gray-500">{session.charger_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <IconClock className="w-3.5 h-3.5" />
                      Started {new Date(session.started_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      <span className="mx-0.5">·</span>
                      <IconBattery className="w-3.5 h-3.5" /> {session.starting_car_percentage}%
                    </p>
                  </div>
                  <Badge tone="green" pulse>Charging</Badge>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="kW consumed"
                      type="number"
                      placeholder="kW used"
                      value={wattInput[session.id] || ""}
                      onChange={e => setWattInput({ ...wattInput, [session.id]: e.target.value })}
                    />
                    <Input
                      label="Ending car %"
                      type="number"
                      min={0}
                      max={100}
                      placeholder="e.g. 90"
                      value={endPctInput[session.id] || ""}
                      onChange={e => setEndPctInput({ ...endPctInput, [session.id]: e.target.value })}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => handleEnd(session.id)}
                    disabled={!wattInput[session.id] || !endPctInput[session.id] || endingId === session.id}
                  >
                    {endingId === session.id ? "Calculating..." : "End & Calculate Price"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Session complete — calculated price popup ─────────────── */}
      <Modal open={endedSession !== null} onClose={() => setEndedSession(null)} title="Session Complete">
        {endedSession && (
          <div className="space-y-5">
            <div className="text-center py-2">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-green-50 text-green-700 flex items-center justify-center mb-3">
                <IconMoney className="w-6 h-6" />
              </div>
              <p className="text-sm text-gray-500">Amount to collect</p>
              <p className="text-4xl font-bold text-green-700 mt-1">{rwf(endedSession.total_price)}</p>
            </div>

            <div className="bg-gray-50 rounded-xl divide-y divide-gray-100 text-sm">
              {[
                ["Car", endedSession.car_plate],
                ["Charger", endedSession.charger_name],
                ["Energy", endedSession.watt_consumed ? kw(endedSession.watt_consumed) : "—"],
                ["Battery", `${endedSession.starting_car_percentage}% → ${endedSession.ending_car_percentage ?? "—"}%`],
                ["Duration", endedSession.duration ?? "—"],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex justify-between px-4 py-2.5">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-gray-900">{val}</span>
                </div>
              ))}
            </div>

            <Button className="w-full py-3" onClick={() => setEndedSession(null)}>
              <IconCheck className="w-4 h-4" /> Okay
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
