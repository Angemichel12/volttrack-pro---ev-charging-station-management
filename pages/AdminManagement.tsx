import React, { useState } from "react";
import { Card, Button, Input } from "../components/Shared";
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Stations</h2>
        <Button onClick={() => setIsAdding(true)}>Add Station</Button>
      </div>

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
              label="Price per Watt (optional)"
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
        <div className="text-center py-12 text-gray-400">Loading stations...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stations.map(st => (
            <Card key={st.id}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">{st.name}</h3>
                  <p className="text-sm text-gray-500">
                    Rate: {st.price_per_watt ? `Rwf ${st.price_per_watt}/W` : "Not set"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Created: {new Date(st.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteStation(st.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>

              {/* Inline price setter per station */}
              <div className="flex gap-2 items-end pt-3 border-t border-gray-100">
                <Input
                  label="Update Rate (Rwf/W)"
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
            <div className="col-span-2 text-center py-12 text-gray-400 border border-dashed rounded-xl">
              No stations yet. Add one above.
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employees</h2>
        <Button onClick={() => setIsAdding(true)}>Add Employee</Button>
      </div>

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
        <div className="text-center py-12 text-gray-400">Loading employees...</div>
      ) : (
        <Card>
          <table className="w-full">
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
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      emp.is_active ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                    }`}>
                      {emp.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    <button
                      onClick={() => deleteEmployee(emp.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Chargers</h2>
        <Button onClick={() => setIsAdding(true)}>Add Charger</Button>
      </div>

      {isAdding && (
        <Card title="New Charger">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Charger Name"
              placeholder="e.g. Charger A"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
              <select
                className="w-full px-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500"
                value={form.station || ""}
                onChange={e => setForm({ ...form, station: e.target.value ? parseInt(e.target.value) : 0 })}
              >
                <option value="">Select station...</option>
                {stations.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Every charger gets a left and a right port, both free to start.</p>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleCreate} disabled={saving || !form.name.trim() || !form.station}>
              {saving ? "Creating..." : "Create Charger"}
            </Button>
            <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading chargers...</div>
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
                  className="text-xs text-red-500 hover:underline shrink-0"
                >
                  Delete
                </button>
              </div>
              <div className="flex gap-2">
                {c.ports.map(p => (
                  <span
                    key={p.port}
                    className={`flex-1 text-center text-xs font-semibold px-2 py-1.5 rounded-lg ${
                      p.available ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
                    }`}
                  >
                    {p.port === "left" ? "Left" : "Right"} — {p.available ? "Free" : "In Use"}
                  </span>
                ))}
              </div>
            </Card>
          ))}
          {chargers.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400 border border-dashed rounded-xl">
              No chargers yet. Add one above.
            </div>
          )}
        </div>
      )}
    </div>
  );
};