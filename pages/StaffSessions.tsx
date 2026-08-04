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
  // Per-session "power went off / couldn't read meter" toggle — when on, the kWh
  // is estimated server-side from the car's history instead of being entered.
  const [outageOn, setOutageOn] = useState<{ [key: number]: boolean }>({});
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
    const outage = !!outageOn[sessionId];
    const watt = wattInput[sessionId];
    const endPct = endPctInput[sessionId];
    // On a power outage only the ending % is required; kWh comes from history.
    if (!endPct || (!outage && !watt)) return;
    setEndingId(sessionId);
    const ended = await endSession(
      sessionId,
      parseFloat(endPct),
      outage ? undefined : watt,
      outage
    );
    setEndingId(null);
    if (!ended) return;
    setWattInput(prev => { const n = { ...prev }; delete n[sessionId]; return n; });
    setEndPctInput(prev => { const n = { ...prev }; delete n[sessionId]; return n; });
    setOutageOn(prev => { const n = { ...prev }; delete n[sessionId]; return n; });
    setEndedSession(ended); // show the calculated price in a popup
    refreshChargers();
  };

  if (dashLoading) return <Loading label="Tegereza..." />;

  // ── No open shift — can't charge yet ───────────────────────────
  if (!openShift) {
    return (
      <div className="space-y-6">
        <PageHeader title="Sessions / Gusharija" subtitle="Charge cars / Sharija imodoka" />
        <EmptyState
          icon={<IconShift className="w-6 h-6" />}
          title="No open shift / Nta shifuti ifunguye"
          hint="Open a shift first. / Banza ufungure shifuti."
          action={
            <Button onClick={() => navigate("/staff/shift")}>
              Open Shift / Fungura shifuti
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <PageHeader
        title="Sessions / Gusharija"
        subtitle={`${data!.station.name} · ${data!.charger_count} charger${data!.charger_count === 1 ? "" : "s"}`}
        actions={<Badge tone="green" pulse>On duty / Uri ku shifuti</Badge>}
      />

      {/* ── Start Session banner ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-2xl px-5 sm:px-6 py-5 shadow-sm">
        <div>
          <h3 className="font-bold text-lg">Start Charging / Tangira Gusharija</h3>
          <p className="text-sm text-white/80 mt-0.5">Car + charger. / Imodoka + charger.</p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          className="!bg-white !text-green-800 font-bold hover:!bg-green-50 shrink-0 w-full sm:w-auto"
        >
          <IconPlus className="w-4 h-4" /> Start / Tangira
        </Button>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title="Start Charging / Tangira Gusharija">
        <div className="space-y-4">
          {/* ── Step 1: the car ────────────────────────────────────── */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">1 · Car / Imodoka</p>
          <div>
            <Input
              label="Plate Number / Plaque"
              placeholder="Shakisha..."
              value={plateQuery}
              onChange={e => handlePlateQueryChange(e.target.value)}
              autoFocus
            />
            {searching && <p className="text-xs text-gray-400 mt-1">Birashakisha...</p>}
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
              <p className="text-sm font-medium text-gray-700">New car / Imodoka nshya:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Owner / Nyir'imodoka (si ngombwa)"
                  value={ownerNameInput}
                  onChange={e => setOwnerNameInput(e.target.value)}
                />
                <Input
                  label="Phone / Telephone (si ngombwa)"
                  value={carPhoneInput}
                  onChange={e => setCarPhoneInput(e.target.value)}
                />
              </div>
              <Input
                label="Notes / Ibindi (si ngombwa)"
                value={carInfoInput}
                onChange={e => setCarInfoInput(e.target.value)}
              />
              <Button
                variant="secondary"
                onClick={handleRegisterCar}
                disabled={registering || carLoading}
                className="w-full sm:w-auto"
              >
                {registering ? "Tegereza..." : `Register / Andika "${plateQuery.trim().toUpperCase()}"`}
              </Button>
            </div>
          )}

          {/* ── Step 2: charger — full when charging 2 cars ────────── */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-2">2 · Charger</p>
          <div>
            {chargersLoading ? (
              <div className="w-full px-4 py-2.5 rounded-xl bg-gray-50 text-gray-400 text-sm animate-pulse">
                Tegereza...
              </div>
            ) : chargers.length === 0 ? (
              <div className="w-full px-4 py-2.5 rounded-xl bg-gray-50 text-gray-400 text-sm">
                No chargers / Nta charger ihari
              </div>
            ) : (
              <Select label="Charger" value={chargerId} onChange={e => setChargerId(e.target.value)}>
                <option value="">Hitamo charger...</option>
                {chargers.map(c => {
                  const carsCharging = c.ports.filter(p => !p.available).length;
                  const full = carsCharging >= c.ports.length;
                  return (
                    <option key={c.id} value={c.id} disabled={full}>
                      {c.name} — {full ? "Full / Yuzuye" : carsCharging > 0 ? `Imodoka ${carsCharging} irasharija` : "Free / Irahari"}
                    </option>
                  );
                })}
              </Select>
            )}
          </div>

          {/* ── Step 3: battery + start ────────────────────────────── */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-2">3 · Battery / Batiri</p>
          <Input
            label="Battery now (%) / Batiri ubu"
            type="number"
            min={0}
            max={100}
            placeholder="urugero: 20"
            value={startPctInput}
            onChange={e => setStartPctInput(e.target.value)}
          />

          <Button
            className="w-full py-3"
            onClick={handleStart}
            disabled={!selectedCar || !chargerId || !startPctInput || starting}
          >
            <IconBolt className="w-4 h-4" />
            {starting ? "Tegereza..." : "Start / Tangira"}
          </Button>
        </div>
      </Modal>

      {/* ── Active Sessions ───────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Charging Now / Ibirasharija</h3>
          {activeSessions.length > 0 && <Badge tone="green" pulse>{activeSessions.length}</Badge>}
          {sessionsLoading && <span className="text-sm font-normal text-gray-400">Tegereza...</span>}
        </div>
        {activeSessions.length === 0 ? (
          <EmptyState
            icon={<IconCharger className="w-6 h-6" />}
            title="No cars charging / Nta modoka irasharija"
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
                  <Badge tone="green" pulse>Charging / Irasharija</Badge>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="kW used / kW zakoreshejwe"
                      type="number"
                      placeholder={outageOn[session.id] ? "Auto / Bibarwa" : "kW"}
                      value={outageOn[session.id] ? "" : (wattInput[session.id] || "")}
                      onChange={e => setWattInput({ ...wattInput, [session.id]: e.target.value })}
                      disabled={!!outageOn[session.id]}
                      hint={outageOn[session.id] ? "Estimated / Bigereranyijwe" : undefined}
                    />
                    <Input
                      label="Battery now (%) / Batiri ubu"
                      type="number"
                      min={0}
                      max={100}
                      placeholder="urugero: 90"
                      value={endPctInput[session.id] || ""}
                      onChange={e => setEndPctInput({ ...endPctInput, [session.id]: e.target.value })}
                    />
                  </div>
                  {/* Power-outage toggle — hide the kWh input, estimate from history */}
                  <label className="flex items-start gap-2 cursor-pointer select-none text-sm text-gray-600">
                    <input
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 accent-green-600 shrink-0"
                      checked={!!outageOn[session.id]}
                      onChange={e => setOutageOn({ ...outageOn, [session.id]: e.target.checked })}
                    />
                    <span>Umuriro uragiye</span>
                  </label>
                  <Button
                    className="w-full"
                    onClick={() => handleEnd(session.id)}
                    disabled={
                      !endPctInput[session.id] ||
                      (!outageOn[session.id] && !wattInput[session.id]) ||
                      endingId === session.id
                    }
                  >
                    {endingId === session.id ? "Tegereza..." : "Finish / Rangiza"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Session complete — calculated price popup ─────────────── */}
      <Modal open={endedSession !== null} onClose={() => setEndedSession(null)} title="Done / Byarangiye">
        {endedSession && (
          <div className="space-y-5">
            <div className="text-center py-2">
              <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${
                endedSession.is_paid ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-600"
              }`}>
                <IconMoney className="w-6 h-6" />
              </div>
              <p className="text-sm text-gray-500">
                {endedSession.is_paid
                  ? "Irishyura"
                  : "Izishyura Nyuma"}
              </p>
              <p className={`text-4xl font-bold mt-1 ${endedSession.is_paid ? "text-green-700" : "text-amber-600"}`}>
                {rwf(endedSession.total_price)}
              </p>
              {!endedSession.is_paid && (
                <div className="mt-2 flex justify-center">
                  <Badge tone="amber">Izishyura Nyuma</Badge>
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl divide-y divide-gray-100 text-sm">
              {[
                ["Car / Imodoka", endedSession.car_plate],
                ["Charger", endedSession.charger_name],
                ["Energy / Umuriro", (
                  <span className="inline-flex items-center gap-1.5">
                    {endedSession.watt_consumed ? kw(endedSession.watt_consumed) : "—"}
                    {endedSession.is_estimated && <Badge tone="amber">Estimated / Bigereranyijwe</Badge>}
                  </span>
                )],
                ["Battery / Batiri", `${endedSession.starting_car_percentage}% → ${endedSession.ending_car_percentage ?? "—"}%`],
                ["Time / Igihe", endedSession.duration ?? "—"],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex justify-between px-4 py-2.5">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-gray-900">{val}</span>
                </div>
              ))}
            </div>

            <Button className="w-full py-3" onClick={() => setEndedSession(null)}>
              <IconCheck className="w-4 h-4" /> OK / Sawa
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
