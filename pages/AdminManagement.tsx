import React, { useState } from "react";
import { Card, Button, Input, Select, PasswordInput, Modal, PageHeader, EmptyState, Loading, Badge, TableSkeleton, Pagination } from "../components/Shared";
import { IconStation, IconUsers, IconCharger, IconPlus, IconTrash, IconPencil, IconKey, IconCheck } from "../components/Icons";
import { useAdminStations, useAdminEmployees, useAdminChargers, type StationPayload, type Station, type EmployeePayload, type EmployeeUpdatePayload, type Employee, type ChargerPayload, type Charger } from "../hooks/useAdmin";

// ─── AdminStations ────────────────────────────────────────────────────────────

export const AdminStations: React.FC = () => {
  const { stations, loading, createStation, updateStation, deleteStation, setPrice } = useAdminStations();
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<StationPayload>({ name: "", price_per_watt: "" });
  const [saving, setSaving] = useState(false);
  const [priceInputs, setPriceInputs] = useState<{ [id: number]: string }>({});

  // ── Edit-station modal (name + price) ──────────────────────────────────────
  const [editing, setEditing] = useState<Station | null>(null);
  const [editForm, setEditForm] = useState<StationPayload>({ name: "", price_per_watt: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const ok = await createStation(form);
    setSaving(false);
    if (ok) {
      setIsAdding(false);
      setForm({ name: "", price_per_watt: "" });
    }
  };

  const handleSetPrice = async (id: number) => {
    const price = priceInputs[id];
    if (!price) return;
    const ok = await setPrice(id, price);
    if (ok) setPriceInputs(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const openEdit = (st: Station) => {
    setEditing(st);
    setEditForm({ name: st.name, price_per_watt: st.price_per_watt ?? "" });
  };

  const handleSaveEdit = async () => {
    if (!editing || !editForm.name.trim()) return;
    setSavingEdit(true);
    const ok = await updateStation(editing.id, {
      name: editForm.name.trim(),
      price_per_watt: editForm.price_per_watt || undefined,
    });
    setSavingEdit(false);
    if (ok) setEditing(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stations / Sitasiyo"
        actions={<Button onClick={() => setIsAdding(true)}><IconPlus className="w-4 h-4" /> Add / Ongera</Button>}
      />

      {isAdding && (
        <Card title="New Station / Sitasiyo Nshya">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Name / Izina"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Station Alpha"
            />
            <Input
              label="Price/kW / Igiciro (si ngombwa)"
              type="number"
              step="0.0001"
              value={form.price_per_watt || ""}
              onChange={e => setForm({ ...form, price_per_watt: e.target.value })}
              placeholder="e.g. 0.0050"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Tegereza..." : "Create / Emeza"}
            </Button>
            <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel / Reka</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <Loading label="Tegereza..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stations.map(st => (
            <Card key={st.id}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">{st.name}</h3>
                  <p className="text-sm text-gray-500">
                    Price / Igiciro: {st.price_per_watt ? `Rwf ${st.price_per_watt}/kW` : "—"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(st.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(st)}
                    aria-label="Edit station"
                    title="Edit / Hindura"
                    className="p-1.5 text-gray-400 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <IconPencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteStation(st.id)}
                    aria-label="Delete station"
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Inline price setter per station */}
              <div className="flex gap-2 items-end pt-3 border-t border-gray-100">
                <Input
                  label="New price (Rwf/kW) / Igiciro gishya"
                  type="number"
                  step="0.0001"
                  placeholder="e.g. 0.0050"
                  value={priceInputs[st.id] || ""}
                  onChange={e => setPriceInputs(prev => ({ ...prev, [st.id]: e.target.value }))}
                />
                <Button
                  variant="secondary"
                  onClick={() => handleSetPrice(st.id)}
                  disabled={!priceInputs[st.id]}
                  className="shrink-0"
                >
                  Set
                </Button>
              </div>
            </Card>
          ))}
          {stations.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={<IconStation className="w-6 h-6" />}
                title="No stations / Nta sitasiyo"
                action={<Button onClick={() => setIsAdding(true)}><IconPlus className="w-4 h-4" /> Add / Ongera</Button>}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Edit station modal ──────────────────────────────────────────── */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Edit / Hindura · ${editing.name}` : ""}
      >
        <div className="space-y-4">
          <Input
            label="Name / Izina"
            value={editForm.name}
            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
            placeholder="e.g. Station Alpha"
          />
          <Input
            label="Price/kW (Rwf) / Igiciro"
            type="number"
            step="0.0001"
            value={editForm.price_per_watt ?? ""}
            onChange={e => setEditForm({ ...editForm, price_per_watt: e.target.value })}
            placeholder="e.g. 0.0050"
          />
          <Button className="w-full py-3" onClick={handleSaveEdit} disabled={savingEdit || !editForm.name.trim()}>
            <IconCheck className="w-4 h-4" />
            {savingEdit ? "Tegereza..." : "Save / Bika"}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

// ─── AdminEmployees ───────────────────────────────────────────────────────────

export const AdminEmployees: React.FC = () => {
  const { employees, loading, page, totalPages, count, changePage, createEmployee, updateEmployee, resetPassword, deleteEmployee } = useAdminEmployees();
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EmployeePayload>({
    name: "",
    phone_number: "",
    password: "",
    role: "staff",
  });

  // ── Edit-employee modal ────────────────────────────────────────────────────
  const [editing, setEditing] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState<EmployeeUpdatePayload>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // ── Reset-password modal ───────────────────────────────────────────────────
  const [resetting, setResetting] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [savingReset, setSavingReset] = useState(false);

  const handleCreate = async () => {
    if (!form.name || !form.phone_number || !form.password) return;
    setSaving(true);
    const ok = await createEmployee(form);
    setSaving(false);
    if (ok) {
      setIsAdding(false);
      setForm({ name: "", phone_number: "", password: "", role: "staff" });
    }
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setEditForm({ name: emp.name, phone_number: emp.phone_number, is_active: emp.is_active });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    const ok = await updateEmployee(editing.id, editForm);
    setSavingEdit(false);
    if (ok) setEditing(null);
  };

  const handleReset = async () => {
    if (!resetting || newPassword.length < 8) return;
    setSavingReset(true);
    const ok = await resetPassword(resetting.id, newPassword);
    setSavingReset(false);
    if (ok) { setResetting(null); setNewPassword(""); }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees / Abakozi"
        actions={<Button onClick={() => setIsAdding(true)}><IconPlus className="w-4 h-4" /> Add / Ongera</Button>}
      />

      {isAdding && (
        <Card title="New Employee / Umukozi Mushya">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Name / Izina"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Phone Number / Numero ya Telephone"
              type="tel"
              value={form.phone_number}
              onChange={e => setForm({ ...form, phone_number: e.target.value })}
            />
            <PasswordInput
              label="Password / Ijambobanga"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Tegereza..." : "Create / Emeza"}
            </Button>
            <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel / Reka</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <Card><TableSkeleton rows={5} cols={4} /></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead className="text-left border-b border-gray-100">
              <tr className="text-xs text-gray-400 uppercase tracking-wider">
                <th className="pb-3 px-2">Name / Izina</th>
                <th className="pb-3 px-2">Phone / Telephone</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {employees.map(emp => (
                <tr key={emp.id} className="text-sm">
                  <td className="py-3 px-2 font-medium">{emp.name}</td>
                  <td className="py-3 px-2 text-gray-500">{emp.phone_number}</td>
                  <td className="py-3 px-2">
                    <Badge tone={emp.is_active ? "green" : "red"}>
                      {emp.is_active ? "Active / Arakora" : "Inactive / Ntakora"}
                    </Badge>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(emp)}
                        aria-label="Edit employee"
                        title="Edit / Hindura"
                        className="p-1.5 text-gray-400 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <IconPencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setResetting(emp); setNewPassword(""); }}
                        aria-label="Reset password"
                        title="Reset password / Hindura ijambobanga"
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <IconKey className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteEmployee(emp.id)}
                        aria-label="Remove employee"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">No employees / Nta bakozi</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            count={count}
            loading={loading}
            onPageChange={changePage}
          />
        </Card>
      )}

      {/* ── Edit employee modal ─────────────────────────────────────────── */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Edit / Hindura · ${editing.name}` : ""}
      >
        <div className="space-y-4">
          <Input
            label="Name / Izina"
            value={editForm.name ?? ""}
            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
          />
          <Input
            label="Phone Number / Numero ya Telephone"
            type="tel"
            value={editForm.phone_number ?? ""}
            onChange={e => setEditForm({ ...editForm, phone_number: e.target.value })}
          />
          <Select
            label="Status / Uko ahagaze"
            value={editForm.is_active ? "active" : "inactive"}
            onChange={e => setEditForm({ ...editForm, is_active: e.target.value === "active" })}
          >
            <option value="active">Active / Arakora</option>
            <option value="inactive">Inactive / Ntakora</option>
          </Select>
          <Button className="w-full py-3" onClick={handleSaveEdit} disabled={savingEdit}>
            <IconCheck className="w-4 h-4" />
            {savingEdit ? "Tegereza..." : "Save / Bika"}
          </Button>
        </div>
      </Modal>

      {/* ── Reset password modal ────────────────────────────────────────── */}
      <Modal
        open={resetting !== null}
        onClose={() => { setResetting(null); setNewPassword(""); }}
        title={resetting ? `Reset password / ${resetting.name}` : ""}
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-400">
            Set a new password for this user (min 8 characters). They'll use it on next login. /
            Shyiraho ijambobanga rishya (nibura inyuguti 8).
          </p>
          <PasswordInput
            label="New password / Ijambobanga rishya"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            hint={newPassword.length > 0 && newPassword.length < 8 ? "Too short / Rigufi cyane (8+)" : undefined}
          />
          <Button className="w-full py-3" onClick={handleReset} disabled={savingReset || newPassword.length < 8}>
            <IconKey className="w-4 h-4" />
            {savingReset ? "Tegereza..." : "Reset / Hindura"}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

// ─── AdminChargers ────────────────────────────────────────────────────────────

export const AdminChargers: React.FC = () => {
  const { chargers, loading, page, totalPages, count, changePage, createCharger, updateCharger, deleteCharger } = useAdminChargers();
  const { stations } = useAdminStations();
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ChargerPayload>({ name: "", station: 0 });

  // ── Edit-charger modal ─────────────────────────────────────────────────────
  const [editing, setEditing] = useState<Charger | null>(null);
  const [editForm, setEditForm] = useState<ChargerPayload>({ name: "", station: 0 });
  const [savingEdit, setSavingEdit] = useState(false);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.station) return;
    setSaving(true);
    const ok = await createCharger(form);
    setSaving(false);
    if (ok) {
      setIsAdding(false);
      setForm({ name: "", station: 0 });
    }
  };

  const openEdit = (c: Charger) => {
    setEditing(c);
    setEditForm({ name: c.name, station: c.station });
  };

  const handleSaveEdit = async () => {
    if (!editing || !editForm.name.trim() || !editForm.station) return;
    setSavingEdit(true);
    const ok = await updateCharger(editing.id, { name: editForm.name.trim(), station: editForm.station });
    setSavingEdit(false);
    if (ok) setEditing(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chargers"
        subtitle="1 charger = 2 cars / Charger imwe = imodoka 2"
        actions={<Button onClick={() => setIsAdding(true)}><IconPlus className="w-4 h-4" /> Add / Ongera</Button>}
      />

      {isAdding && (
        <Card title="New Charger / Charger Nshya">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Name / Izina"
              placeholder="urugero: Charger A"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <Select
              label="Station / Sitasiyo"
              value={form.station || ""}
              onChange={e => setForm({ ...form, station: e.target.value ? parseInt(e.target.value) : 0 })}
            >
              <option value="">Hitamo sitasiyo...</option>
              {stations.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </Select>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleCreate} disabled={saving || !form.name.trim() || !form.station}>
              {saving ? "Tegereza..." : "Create / Emeza"}
            </Button>
            <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel / Reka</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <Loading label="Tegereza..." />
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chargers.map(c => (
            <Card key={c.id}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">{c.name}</h3>
                  <p className="text-sm text-gray-500">{c.station_name}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(c)}
                    aria-label="Edit charger"
                    title="Edit / Hindura"
                    className="p-1.5 text-gray-400 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                  >
                    <IconPencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteCharger(c.id)}
                    aria-label="Delete charger"
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {(() => {
                const carsCharging = c.ports.filter(p => !p.available).length;
                const capacity = c.ports.length;
                const full = carsCharging >= capacity;
                return (
                  <div
                    className={`text-center text-xs font-semibold px-2 py-1.5 rounded-lg ${
                      full
                        ? "bg-red-50 text-red-500"
                        : carsCharging > 0
                        ? "bg-amber-50 text-amber-600"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    {full
                      ? "Full / Yuzuye"
                      : carsCharging > 0
                      ? `Imodoka ${carsCharging} irasharija`
                      : "Free / Irahari"}
                  </div>
                );
              })()}
            </Card>
          ))}
          {chargers.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={<IconCharger className="w-6 h-6" />}
                title="No chargers / Nta charger"
                action={<Button onClick={() => setIsAdding(true)}><IconPlus className="w-4 h-4" /> Add / Ongera</Button>}
              />
            </div>
          )}
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          count={count}
          loading={loading}
          onPageChange={changePage}
        />
        </>
      )}

      {/* ── Edit charger modal ──────────────────────────────────────────── */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `Edit / Hindura · ${editing.name}` : ""}
      >
        <div className="space-y-4">
          <Input
            label="Name / Izina"
            placeholder="urugero: Charger A"
            value={editForm.name}
            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
          />
          <Select
            label="Station / Sitasiyo"
            value={editForm.station || ""}
            onChange={e => setEditForm({ ...editForm, station: e.target.value ? parseInt(e.target.value) : 0 })}
          >
            <option value="">Hitamo sitasiyo...</option>
            {stations.map(st => (
              <option key={st.id} value={st.id}>{st.name}</option>
            ))}
          </Select>
          <Button className="w-full py-3" onClick={handleSaveEdit} disabled={savingEdit || !editForm.name.trim() || !editForm.station}>
            <IconCheck className="w-4 h-4" />
            {savingEdit ? "Tegereza..." : "Save / Bika"}
          </Button>
        </div>
      </Modal>
    </div>
  );
};