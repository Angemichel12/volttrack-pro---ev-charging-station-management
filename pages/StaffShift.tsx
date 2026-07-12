import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, StatCard, Button, Input, Select, PageHeader, Loading, Badge } from "../components/Shared";
import { IconMoney, IconBolt, IconCharger, IconStation, IconPlus, IconArrowRight } from "../components/Icons";
import { rwf } from "../utils/format";
import { useStaffDashboard, useShift, useStations } from "../hooks/useStaff";

// Staff land here after login: open a shift to start working, or manage /
// close the one that's already open.
export const StaffShiftPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, loading: dashLoading, refresh } = useStaffDashboard();
  const { openShift, setOpenShift, loading: shiftLoading, openShiftFn, addCashpowerFn, closeShiftFn } = useShift();
  const { stations, loading: stationsLoading } = useStations();

  const [stationId, setStationId] = useState("");
  const [cashpowerStartInput, setCashpowerStartInput] = useState("");
  const [cashpowerAddInput, setCashpowerAddInput] = useState("");
  const [moneyOnMomoInput, setMoneyOnMomoInput] = useState("");
  const [endCashpowerInput, setEndCashpowerInput] = useState("");
  const [shiftNotes, setShiftNotes] = useState("");

  // Sync open shift from dashboard data on load
  React.useEffect(() => {
    if (data?.open_shift) setOpenShift(data.open_shift);
  }, [data]);

  const handleOpenShift = async () => {
    if (!stationId || !cashpowerStartInput) return;
    const ok = await openShiftFn(parseInt(stationId), cashpowerStartInput, shiftNotes);
    if (ok) {
      setStationId("");
      setCashpowerStartInput("");
      setShiftNotes("");
      navigate("/staff/sessions"); // straight to work — start charging cars
    }
  };

  const handleAddCashpower = async () => {
    if (!openShift || !cashpowerAddInput) return;
    const ok = await addCashpowerFn(openShift.id, cashpowerAddInput);
    if (ok) setCashpowerAddInput("");
  };

  const handleCloseShift = async () => {
    if (!openShift || !moneyOnMomoInput || !endCashpowerInput) return;
    const ok = await closeShiftFn(openShift.id, moneyOnMomoInput, endCashpowerInput, shiftNotes);
    if (ok) {
      setMoneyOnMomoInput("");
      setEndCashpowerInput("");
      setShiftNotes("");
      refresh();
    }
  };

  if (dashLoading) return <Loading label="Checking your shift..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Shift"
        subtitle={openShift ? `On duty at ${openShift.station_name}` : "Open a shift to start charging cars"}
        actions={openShift ? <Badge tone="green" pulse>Shift open</Badge> : <Badge tone="gray">Off duty</Badge>}
      />

      {/* ── Station summary (only while a shift is open) ──────────── */}
      {openShift && data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Station" value={data.station.name} icon={<IconStation className="w-5 h-5" />} />
          <StatCard label="Chargers" value={data.charger_count} icon={<IconCharger className="w-5 h-5" />} />
          <StatCard label="Earnings this shift" value={rwf(data.total_earnings)} icon={<IconMoney className="w-5 h-5" />} tone="green" />
          <StatCard label="Sessions" value={data.total_sessions ?? 0} icon={<IconBolt className="w-5 h-5" />} />
        </div>
      )}

      {!openShift ? (
        /* ── Open a new shift ────────────────────────────────────── */
        <Card title="Open a New Shift">
          <div className="space-y-4">
            <p className="text-sm text-gray-500 -mt-1">
              Pick your station and enter the CashPower meter reading to begin. You'll be taken straight
              to charging sessions once your shift is open.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stationsLoading ? (
                <div className="w-full px-4 py-2.5 rounded-xl bg-gray-50 text-gray-400 text-sm animate-pulse">
                  Loading stations...
                </div>
              ) : (
                <Select label="Station" value={stationId} onChange={e => setStationId(e.target.value)}>
                  <option value="">Select station...</option>
                  {stations.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </Select>
              )}
              <Input
                label="Starting Cashpower (kW)"
                type="number"
                placeholder="e.g. 1250"
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
                  <IconArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        /* ── Manage / close the open shift ───────────────────────── */
        <Card title="Current Shift">
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              {[
                ["Started", new Date(openShift.shift_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })],
                ["Station", openShift.station_name],
                ["Starting Cashpower (kW)", openShift.start_kwatts_in_cashpower],
                ["Added Cashpower (kW)", openShift.addition_kwatt_in_cashpower],
              ].map(([label, val]) => (
                <div key={String(label)} className="bg-green-50/70 rounded-xl p-3">
                  <p className="text-[10px] text-green-700/70 uppercase tracking-wider font-semibold mb-1">{label}</p>
                  <p className="font-semibold text-green-900 truncate">{val}</p>
                </div>
              ))}
            </div>

            {/* Go charge cars */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-2xl px-5 py-4">
              <div>
                <h3 className="font-bold">Ready to charge</h3>
                <p className="text-sm text-white/80">Start and manage charging sessions for this shift.</p>
              </div>
              <Button
                onClick={() => navigate("/staff/sessions")}
                className="!bg-white !text-green-800 font-bold hover:!bg-green-50 shrink-0 w-full sm:w-auto"
              >
                Go to Sessions <IconArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Add cashpower mid-shift */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-3">Top up CashPower mid-shift</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <Input
                  label="Amount to add (kW)"
                  type="number"
                  placeholder="e.g. 50"
                  value={cashpowerAddInput}
                  onChange={e => setCashpowerAddInput(e.target.value)}
                />
                <Button
                  variant="secondary"
                  onClick={handleAddCashpower}
                  disabled={shiftLoading || !cashpowerAddInput}
                  className="shrink-0"
                >
                  <IconPlus className="w-4 h-4" /> Add
                </Button>
              </div>
            </div>

            {/* Close shift */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-1">Close shift</p>
              <p className="text-xs text-gray-400 mb-3">
                Enter the MoMo cash collected and the actual CashPower meter reading — totals are calculated
                automatically. You must close your shift before logging out.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Money on MoMo (Rwf)"
                  type="number"
                  placeholder="e.g. 13800"
                  value={moneyOnMomoInput}
                  onChange={e => setMoneyOnMomoInput(e.target.value)}
                />
                <Input
                  label="Ending Cashpower reading (kW)"
                  type="number"
                  placeholder="e.g. 1250"
                  value={endCashpowerInput}
                  onChange={e => setEndCashpowerInput(e.target.value)}
                />
                <Input
                  label="Closing notes (optional)"
                  placeholder="Any notes..."
                  value={shiftNotes}
                  onChange={e => setShiftNotes(e.target.value)}
                />
              </div>
              <Button
                variant="danger"
                onClick={handleCloseShift}
                disabled={shiftLoading || !moneyOnMomoInput || !endCashpowerInput}
                className="mt-3 w-full sm:w-auto"
              >
                {shiftLoading ? "Closing..." : "Close Shift"}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
