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

  if (dashLoading) return <Loading label="Tegereza..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Shift / shifuti Yanjye"
        subtitle={openShift ? `${openShift.station_name}` : "Open a shift / Fungura shifuti"}
        actions={openShift ? <Badge tone="green" pulse>On duty / Uri ku shifuti</Badge> : <Badge tone="gray">Off duty / Nta shifuti</Badge>}
      />

      {/* ── Station summary (only while a shift is open) ──────────── */}
      {openShift && data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Station / Sitasiyo" value={data.station.name} icon={<IconStation className="w-5 h-5" />} />
          <StatCard label="Chargers" value={data.charger_count} icon={<IconCharger className="w-5 h-5" />} />
          <StatCard label="Earnings / Ayinjiye" value={rwf(data.total_earnings)} icon={<IconMoney className="w-5 h-5" />} tone="green" />
          <StatCard label="Sessions / Gusharija" value={data.total_sessions ?? 0} icon={<IconBolt className="w-5 h-5" />} />
        </div>
      )}

      {!openShift ? (
        /* ── Open a new shift ────────────────────────────────────── */
        <Card title="Open Shift / Fungura shifuti">
          <div className="space-y-4">
            <p className="text-sm text-gray-500 -mt-1">
              Pick station, enter Cashpower. / Hitamo sitasiyo, andika Cashpower.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stationsLoading ? (
                <div className="w-full px-4 py-2.5 rounded-xl bg-gray-50 text-gray-400 text-sm animate-pulse">
                  Tegereza...
                </div>
              ) : (
                <Select label="Station / Sitasiyo" value={stationId} onChange={e => setStationId(e.target.value)}>
                  <option value="">Hitamo sitasiyo...</option>
                  {stations.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </Select>
              )}
              <Input
                label="Start Cashpower (kW) / Cashpower utangira"
                type="number"
                placeholder="urugero: 1250"
                value={cashpowerStartInput}
                onChange={e => setCashpowerStartInput(e.target.value)}
              />
              <Input
                label="Notes / Ibindi (si ngombwa)"
                placeholder="..."
                value={shiftNotes}
                onChange={e => setShiftNotes(e.target.value)}
              />
              <div className="flex items-end">
                <Button
                  className="w-full"
                  onClick={handleOpenShift}
                  disabled={shiftLoading || !stationId || !cashpowerStartInput}
                >
                  {shiftLoading ? "Tegereza..." : "Open Shift / Fungura shifuti"}
                  <IconArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        /* ── Manage / close the open shift ───────────────────────── */
        <Card title="Current Shift / shifuti ya None">
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              {[
                ["Started / Yatangiye", new Date(openShift.shift_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })],
                ["Station / Sitasiyo", openShift.station_name],
                ["Start Cashpower (kW)", openShift.start_kwatts_in_cashpower],
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
                <h3 className="font-bold">Ready to charge / Witeguye gusharija</h3>
              </div>
              <Button
                onClick={() => navigate("/staff/sessions")}
                className="!bg-white !text-green-800 font-bold hover:!bg-green-50 shrink-0 w-full sm:w-auto"
              >
                Sessions / Gusharija <IconArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Add cashpower mid-shift */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-3">Add Cashpower / Kongera Cashpower</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <Input
                  label="kW to add / kW zo kongera"
                  type="number"
                  placeholder="urugero: 50"
                  value={cashpowerAddInput}
                  onChange={e => setCashpowerAddInput(e.target.value)}
                />
                <Button
                  variant="secondary"
                  onClick={handleAddCashpower}
                  disabled={shiftLoading || !cashpowerAddInput}
                  className="shrink-0"
                >
                  <IconPlus className="w-4 h-4" /> Add / Ongera
                </Button>
              </div>
            </div>

            {/* Close shift */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-1">Close Shift / Funga shifuti</p>
              <p className="text-xs text-gray-400 mb-3">
                Enter MoMo money and end Cashpower. / Andika amafaranga ya MoMo na Cashpower usoza.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Money on MoMo (Rwf) / Amafaranga kuri MoMo"
                  type="number"
                  placeholder="urugero: 13800"
                  value={moneyOnMomoInput}
                  onChange={e => setMoneyOnMomoInput(e.target.value)}
                />
                <Input
                  label="End Cashpower (kW) / Cashpower usoza"
                  type="number"
                  placeholder="urugero: 1250"
                  value={endCashpowerInput}
                  onChange={e => setEndCashpowerInput(e.target.value)}
                />
                <Input
                  label="Notes / Ibindi (si ngombwa)"
                  placeholder="..."
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
                {shiftLoading ? "Tegereza..." : "Close Shift / Funga shifuti"}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
