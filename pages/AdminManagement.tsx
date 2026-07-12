import React, { useState } from "react";
import { Card, Button, Input, Select, PageHeader, EmptyState, Loading, Badge, TableSkeleton } from "../components/Shared";
import { IconStation, IconUsers, IconCharger, IconPlus, IconTrash } from "../components/Icons";
import { useAdminStations, useAdminEmployees, useAdminChargers, type StationPayload, type EmployeePayload, type ChargerPayload } from "../hooks/useAdmin";

// ─── AdminStations ────────────────────────────────────────────────────────────

export const AdminStations: React.FC = () => {
  const { stations, loading, createStation, updateStation, deleteStation, setPrice } = useAdminStations();
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<StationPayload>({ name: "", price_per_watt: "" });
  const [saving, setSaving] = useState(false);
  const [priceInputs, setPriceInputs] = useState<{ [id: number]: string }>({});

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stations"
        subtitle="Create stations and manage their charging rates"
        actions={<Button onClick={() => setIsAdding(true)}><IconPlus className="w-4 h-4" /> Add Station</Button>}
      />

      {isAdding && (
        <Card title="New Station">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Station Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Station Alpha"
            />
            <Input
              label="Price per kW (optional)"
              type="number"
              step="0.0001"
              value={form.price_per_watt || ""}
              onChange={e => setForm({ ...form, price_per_watt: e.target.value })}
              placeholder="e.g. 0.0050"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Creating..." : "Create Station"}
            </Button>
            <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <Loading label="Loading stations..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stations.map(st => (
            <Card key={st.id}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">{st.name}</h3>
                  <p className="text-sm text-gray-500">
                    Rate: {st.price_per_watt ? `Rwf ${st.price_per_watt}/kW` : "Not set"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Created: {new Date(st.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteStation(st.id)}
                  aria-label="Delete station"
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>

              {/* Inline price setter per station */}
              <div className="flex gap-2 items-end pt-3 border-t border-gray-100">
                <Input
                  label="Update Rate (Rwf/kW)"
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
                title="No stations yet"
                hint="Add your first charging station to get started."
                action={<Button onClick={() => setIsAdding(true)}><IconPlus className="w-4 h-4" /> Add Station</Button>}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── AdminEmployees ───────────────────────────────────────────────────────────

export const AdminEmployees: React.FC = () => {
  const { employees, loading, createEmployee, deleteEmployee } = useAdminEmployees();
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EmployeePayload>({
    name: "",
    phone_number: "",
    password: "",
    role: "staff",
  });

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        subtitle="Staff accounts that can open shifts and run sessions"
        actions={<Button onClick={() => setIsAdding(true)}><IconPlus className="w-4 h-4" /> Add Employee</Button>}
      />

      {isAdding && (
        <Card title="New Employee">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Full Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Phone Number"
              type="tel"
              value={form.phone_number}
              onChange={e => setForm({ ...form, phone_number: e.target.value })}
            />
            <Input
              label="Password"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Creating..." : "Create Employee"}
            </Button>
            <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
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
                <th className="pb-3 px-2">Name</th>
                <th className="pb-3 px-2">Phone Number</th>
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
                      {emp.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => deleteEmployee(emp.id)}
                      aria-label="Remove employee"
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">No employees found</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </Card>
      )}
    </div>
  );
};

// ─── AdminChargers ────────────────────────────────────────────────────────────

export const AdminChargers: React.FC = () => {
  const { chargers, loading, createCharger, deleteCharger } = useAdminChargers();
  const { stations } = useAdminStations();
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ChargerPayload>({ name: "", station: 0 });

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chargers"
        subtitle="Each charger has a left and a right port, charging independently"
        actions={<Button onClick={() => setIsAdding(true)}><IconPlus className="w-4 h-4" /> Add Charger</Button>}
      />

      {isAdding && (
        <Card title="New Charger">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Charger Name"
              placeholder="e.g. Charger A"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <Select
              label="Station"
              value={form.station || ""}
              onChange={e => setForm({ ...form, station: e.target.value ? parseInt(e.target.value) : 0 })}
            >
              <option value="">Select station...</option>
              {stations.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </Select>
          </div>
          <p className="text-xs text-gray-400 mt-2">Every charger can charge up to 2 cars at the same time.</p>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleCreate} disabled={saving || !form.name.trim() || !form.station}>
              {saving ? "Creating..." : "Create Charger"}
            </Button>
            <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <Loading label="Loading chargers..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chargers.map(c => (
            <Card key={c.id}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">{c.name}</h3>
                  <p className="text-sm text-gray-500">{c.station_name}</p>
                </div>
                <button
                  onClick={() => deleteCharger(c.id)}
                  aria-label="Delete charger"
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                >
                  <IconTrash className="w-4 h-4" />
                </button>
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
                      ? "Not available — charging 2 cars"
                      : carsCharging > 0
                      ? `${carsCharging} car charging · 1 slot free`
                      : "Available"}
                  </div>
                );
              })()}
            </Card>
          ))}
          {chargers.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={<IconCharger className="w-6 h-6" />}
                title="No chargers yet"
                hint="Add a charger to a station so staff can start sessions."
                action={<Button onClick={() => setIsAdding(true)}><IconPlus className="w-4 h-4" /> Add Charger</Button>}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};