import React, { useState } from "react";
import { Card, PageHeader, StatCard, TableSkeleton, Button, Input, Modal, Pagination } from "../components/Shared";
import { IconBolt, IconMoney, IconCharger, IconShift, IconPencil, IconCheck } from "../components/Icons";
import { rwf, kw, toDateTimeLocal, fromDateTimeLocal } from "../utils/format";
import { useStaffHistory, type Session, type SessionUpdatePayload } from "../hooks/useStaff";

// Blank form for the edit-session modal (all as strings for the inputs).
// Port is intentionally omitted — it's an internal detail the app auto-assigns.
interface EditForm {
  started_at: string;
  ended_at: string;
  starting_car_percentage: string;
  ending_car_percentage: string;
  watt_consumed: string;
}

export const StaffHistory: React.FC = () => {
  const {
    sessions,
    shifts,
    loading,
    sessionsPage,
    sessionsTotalPages,
    sessionsCount,
    changeSessionsPage,
    shiftsPage,
    shiftsTotalPages,
    shiftsCount,
    changeShiftsPage,
    updateSession,
  } = useStaffHistory();
  const [tab, setTab] = useState<"sessions" | "shifts">("sessions");

  // ── Edit-session modal ────────────────────────────────────────────────────
  const [editing, setEditing] = useState<Session | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const openEdit = (s: Session) => {
    setEditing(s);
    setEditForm({
      started_at: toDateTimeLocal(s.started_at),
      ended_at: toDateTimeLocal(s.ended_at),
      starting_car_percentage: s.starting_car_percentage != null ? String(s.starting_car_percentage) : "",
      ending_car_percentage: s.ending_car_percentage != null ? String(s.ending_car_percentage) : "",
      watt_consumed: s.watt_consumed ?? "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editing || !editForm) return;
    // Only send fields that carry a value — the API changes just what it receives.
    const payload: SessionUpdatePayload = {};
    const startIso = fromDateTimeLocal(editForm.started_at);
    if (startIso) payload.started_at = startIso;
    const endIso = fromDateTimeLocal(editForm.ended_at);
    if (endIso) payload.ended_at = endIso;
    if (editForm.starting_car_percentage !== "") payload.starting_car_percentage = parseFloat(editForm.starting_car_percentage);
    if (editForm.ending_car_percentage !== "") payload.ending_car_percentage = parseFloat(editForm.ending_car_percentage);
    if (editForm.watt_consumed !== "") payload.watt_consumed = editForm.watt_consumed;
    setSavingEdit(true);
    const updated = await updateSession(editing.id, payload);
    setSavingEdit(false);
    if (updated) { setEditing(null); setEditForm(null); }
  };

  const completed = sessions.filter(s => s.ended_at !== null);
  const totalEarnings = completed.reduce((sum, s) => sum + parseFloat(s.total_price || "0"), 0);
  const totalWatt = completed.reduce((sum, s) => sum + parseFloat(s.watt_consumed || "0"), 0);
  const totalKwh = shifts.reduce((sum, s) => sum + parseFloat(s.total_kwatt_used_on_shift || "0"), 0);

  // Summary tiles sum only the loaded page — flag that when there's more than one.
  const pageScoped = (tab === "sessions" ? sessionsTotalPages : shiftsTotalPages) > 1;
  const scopeSub = pageScoped ? "This page / Uru rupapuro" : undefined;

  return (
    <div className="space-y-6">
      <PageHeader title="History / Amateka" subtitle="Sessions + shifts / Gusharija + shifuti" />

      {/* ── Summary ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Sessions / Gusharija" value={completed.length} icon={<IconCharger className="w-5 h-5" />} sub={scopeSub} />
        <StatCard label="Earnings / Ayinjiye" value={rwf(totalEarnings)} icon={<IconMoney className="w-5 h-5" />} tone="green" sub={scopeSub} />
        <StatCard label="kW used / kW zakoreshejwe" value={kw(totalWatt)} icon={<IconBolt className="w-5 h-5" />} sub={scopeSub} />
        <StatCard label="kWh (shifts)" value={`${totalKwh.toFixed(2)} kWh`} icon={<IconShift className="w-5 h-5" />} sub={scopeSub} />
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
            {t === "sessions" ? "Sessions / Gusharija" : "Shifts / shifuti"}
          </button>
        ))}
      </div>

      {loading ? (
        <Card><TableSkeleton rows={6} cols={tab === "sessions" ? 8 : 8} /></Card>
      ) : tab === "sessions" ? (
        // ── Sessions Table ────────────────────────────────────────
        <Card>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="text-left border-b border-gray-100">
              <tr className="text-xs text-gray-400 uppercase tracking-wider">
                <th className="pb-3 px-2">Plate / Plaque</th>
                <th className="pb-3 px-2">Charger</th>
                <th className="pb-3 px-2">Battery / Batiri</th>
                <th className="pb-3 px-2">kW</th>
                <th className="pb-3 px-2">Price / Igiciro</th>
                <th className="pb-3 px-2">Start / Itangira</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sessions.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No sessions / Nta gusharija</td></tr>
              )}
              {sessions.map(s => (
                <tr key={s.id} className="text-sm">
                  <td className="py-3 px-2 font-medium">{s.car_plate}</td>
                  <td className="py-3 px-2 text-gray-500">{s.charger_name}</td>
                  <td className="py-3 px-2 text-gray-500">
                    {s.starting_car_percentage}% → {s.ending_car_percentage ?? "—"}%
                  </td>
                  <td className="py-3 px-2">
                    <span className="inline-flex items-center gap-1.5">
                      {s.watt_consumed ? kw(s.watt_consumed) : "—"}
                      {s.is_estimated && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-50 text-amber-600" title="Estimated after power outage / Bigereranyijwe">
                          Est.
                        </span>
                      )}
                    </span>
                  </td>
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
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => openEdit(s)}
                      aria-label="Edit session"
                      title="Edit / Hindura"
                      className="p-1.5 text-gray-400 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <IconPencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <Pagination
            page={sessionsPage}
            totalPages={sessionsTotalPages}
            count={sessionsCount}
            loading={loading}
            onPageChange={changeSessionsPage}
          />
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
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No shifts / Nta shifuti</td></tr>
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
          <Pagination
            page={shiftsPage}
            totalPages={shiftsTotalPages}
            count={shiftsCount}
            loading={loading}
            onPageChange={changeShiftsPage}
          />
        </Card>
      )}

      {/* ── Edit session modal ────────────────────────────────────── */}
      <Modal
        open={editing !== null}
        onClose={() => { setEditing(null); setEditForm(null); }}
        title={editing ? `Edit / Hindura · ${editing.car_plate}` : ""}
      >
        {editForm && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400">
              Leave a field as-is to keep it. Price is recalculated automatically. /
              Usiga uko kimeze ntikihinduka. Igiciro kibarwa nyuma.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Started / Yatangiye"
                type="datetime-local"
                value={editForm.started_at}
                onChange={e => setEditForm({ ...editForm, started_at: e.target.value })}
              />
              <Input
                label="Ended / Yarangiye"
                type="datetime-local"
                value={editForm.ended_at}
                onChange={e => setEditForm({ ...editForm, ended_at: e.target.value })}
              />
              <Input
                label="Start battery (%) / Batiri itangira"
                type="number"
                min={0}
                max={100}
                value={editForm.starting_car_percentage}
                onChange={e => setEditForm({ ...editForm, starting_car_percentage: e.target.value })}
              />
              <Input
                label="End battery (%) / Batiri iherezo"
                type="number"
                min={0}
                max={100}
                value={editForm.ending_car_percentage}
                onChange={e => setEditForm({ ...editForm, ending_car_percentage: e.target.value })}
              />
              <Input
                label="kW used / kW zakoreshejwe"
                type="number"
                min={0}
                step="0.01"
                value={editForm.watt_consumed}
                onChange={e => setEditForm({ ...editForm, watt_consumed: e.target.value })}
              />
            </div>
            <Button className="w-full py-3" onClick={handleSaveEdit} disabled={savingEdit}>
              <IconCheck className="w-4 h-4" />
              {savingEdit ? "Tegereza..." : "Save / Bika"}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
