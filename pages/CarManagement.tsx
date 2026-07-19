import React, { useState } from "react";
import { Card, Button, Input, PageHeader, TableSkeleton } from "../components/Shared";
import { IconPlus, IconTrash } from "../components/Icons";
import { useAuth } from "../context/AuthContext";
import { useCars, type CarPayload } from "../hooks/useCars";

const emptyForm: CarPayload = {
  plate_number: "",
  owner_name: "",
  phone_number: "",
  optional_info: "",
  unique_price: "",
};

export const CarManagement: React.FC = () => {
  const { isAdmin } = useAuth();
  const { cars, loading, createCar, updateCar, deleteCar } = useCars();
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CarPayload>(emptyForm);
  const [priceInputs, setPriceInputs] = useState<{ [id: number]: string }>({});

  const handleCreate = async () => {
    if (!form.plate_number.trim()) return;
    setSaving(true);
    const payload: CarPayload = {
      plate_number: form.plate_number.trim().toUpperCase(),
      owner_name: form.owner_name || undefined,
      phone_number: form.phone_number || undefined,
      optional_info: form.optional_info || undefined,
      ...(isAdmin && form.unique_price ? { unique_price: form.unique_price } : {}),
    };
    const ok = await createCar(payload);
    setSaving(false);
    if (ok) {
      setIsAdding(false);
      setForm(emptyForm);
    }
  };

  const handleSetPrice = async (id: number) => {
    const price = priceInputs[id];
    if (!price) return;
    const ok = await updateCar(id, { unique_price: price });
    if (ok) setPriceInputs(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cars / Imodoka"
        actions={<Button onClick={() => setIsAdding(true)}><IconPlus className="w-4 h-4" /> Add Car / Andika Imodoka</Button>}
      />

      {isAdding && (
        <Card title="New Car / Imodoka Nshya">
          <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4`}>
            <Input
              label="Plate Number / Plaque"
              placeholder="ABC-123"
              value={form.plate_number}
              onChange={e => setForm({ ...form, plate_number: e.target.value })}
            />
            <Input
              label="Owner / Nyir'imodoka (si ngombwa)"
              value={form.owner_name}
              onChange={e => setForm({ ...form, owner_name: e.target.value })}
            />
            <Input
              label="Phone / Telephone (si ngombwa)"
              value={form.phone_number}
              onChange={e => setForm({ ...form, phone_number: e.target.value })}
            />
            {isAdmin && (
              <Input
                label="Price/kW (Rwf) / Igiciro (si ngombwa)"
                type="number"
                step="0.0001"
                placeholder="Overrides station rate"
                value={form.unique_price}
                onChange={e => setForm({ ...form, unique_price: e.target.value })}
              />
            )}
            <Input
              label="Notes / Ibindi (si ngombwa)"
              value={form.optional_info}
              onChange={e => setForm({ ...form, optional_info: e.target.value })}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleCreate} disabled={saving || !form.plate_number.trim()}>
              {saving ? "Tegereza..." : "Add / Andika"}
            </Button>
            <Button variant="outline" onClick={() => { setIsAdding(false); setForm(emptyForm); }}>
              Cancel / Reka
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <Card><TableSkeleton rows={6} cols={isAdmin ? 6 : 4} /></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-left border-b border-gray-100">
                <tr className="text-xs text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 px-2">Plate / Plaque</th>
                  <th className="pb-3 px-2">Owner / Nyir'imodoka</th>
                  <th className="pb-3 px-2">Phone / Telephone</th>
                  <th className="pb-3 px-2">Notes / Ibindi</th>
                  {isAdmin && <th className="pb-3 px-2">Price/kW (Rwf)</th>}
                  {isAdmin && <th className="pb-3 px-2"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cars.map(c => (
                  <tr key={c.id} className="text-sm">
                    <td className="py-3 px-2 font-medium">{c.plate_number}</td>
                    <td className="py-3 px-2 text-gray-500">{c.owner_name || "—"}</td>
                    <td className="py-3 px-2 text-gray-500">{c.phone_number || "—"}</td>
                    <td className="py-3 px-2 text-gray-500">{c.optional_info || "—"}</td>
                    {isAdmin && (
                      <td className="py-3 px-2">
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            step="0.0001"
                            placeholder={c.unique_price ?? "Not set"}
                            value={priceInputs[c.id] ?? ""}
                            onChange={e => setPriceInputs(prev => ({ ...prev, [c.id]: e.target.value }))}
                            className="w-28 px-2 py-1 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <button
                            onClick={() => handleSetPrice(c.id)}
                            disabled={!priceInputs[c.id]}
                            className="text-xs font-medium text-green-700 hover:underline disabled:opacity-40 disabled:no-underline shrink-0"
                          >
                            Set
                          </button>
                        </div>
                      </td>
                    )}
                    {isAdmin && (
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => deleteCar(c.id)}
                          aria-label="Remove car"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {cars.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 4} className="text-center py-8 text-gray-400">
                      No cars / Nta modoka
                    </td>
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
