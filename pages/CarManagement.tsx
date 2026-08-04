import React, { useState } from "react";
import { Card, Button, Input, Badge, Modal, PageHeader, TableSkeleton, Loading } from "../components/Shared";
import { IconPlus, IconTrash, IconWallet, IconCheck } from "../components/Icons";
import { useAuth } from "../context/AuthContext";
import { useCars, type CarPayload, type Car, type CarBalanceResponse } from "../hooks/useCars";
import { rwf } from "../utils/format";

const emptyForm: CarPayload = {
  plate_number: "",
  owner_name: "",
  phone_number: "",
  optional_info: "",
  unique_price: "",
  is_postpaid: false,
};

export const CarManagement: React.FC = () => {
  const { isAdmin } = useAuth();
  const { cars, loading, createCar, updateCar, deleteCar, fetchBalance, payCar } = useCars();
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CarPayload>(emptyForm);
  const [priceInputs, setPriceInputs] = useState<{ [id: number]: string }>({});

  // ── Balance / pay-later modal ─────────────────────────────────────────────
  const [balanceCar, setBalanceCar] = useState<Car | null>(null);
  const [balance, setBalance] = useState<CarBalanceResponse | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [paying, setPaying] = useState(false);

  const handleCreate = async () => {
    if (!form.plate_number.trim()) return;
    setSaving(true);
    const payload: CarPayload = {
      plate_number: form.plate_number.trim().toUpperCase(),
      owner_name: form.owner_name || undefined,
      phone_number: form.phone_number || undefined,
      optional_info: form.optional_info || undefined,
      ...(isAdmin && form.unique_price ? { unique_price: form.unique_price } : {}),
      ...(isAdmin && form.is_postpaid ? { is_postpaid: true } : {}),
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

  // Flip a car between prepaid (settled at charge time) and postpaid (pay-later debt).
  const togglePostpaid = (car: Car) => updateCar(car.id, { is_postpaid: !car.is_postpaid });

  const openBalance = async (car: Car) => {
    setBalanceCar(car);
    setBalance(null);
    setPayAmount("");
    setPayNote("");
    setBalanceLoading(true);
    const data = await fetchBalance(car.id);
    setBalance(data);
    setBalanceLoading(false);
  };

  const closeBalance = () => {
    setBalanceCar(null);
    setBalance(null);
  };

  const handlePay = async () => {
    if (!balanceCar || !payAmount) return;
    setPaying(true);
    const updated = await payCar(balanceCar.id, payAmount, payNote || undefined);
    setPaying(false);
    if (updated) {
      setBalance(updated);
      setPayAmount("");
      setPayNote("");
    }
  };

  const outstanding = parseFloat(balance?.balance?.outstanding ?? "0");

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
          {isAdmin && (
            <label className="flex items-start gap-2 mt-4 cursor-pointer select-none text-sm text-gray-700">
              <input
                type="checkbox"
                className="mt-0.5 w-4 h-4 accent-green-600 shrink-0"
                checked={!!form.is_postpaid}
                onChange={e => setForm({ ...form, is_postpaid: e.target.checked })}
              />
              <span>
                Pay-later / Kwishyura nyuma
                <span className="block text-xs text-gray-400">
                  Charges accumulate as debt instead of being paid at charge time.
                </span>
              </span>
            </label>
          )}
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
        <Card><TableSkeleton rows={6} cols={isAdmin ? 7 : 4} /></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="text-left border-b border-gray-100">
                <tr className="text-xs text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 px-2">Plate / Plaque</th>
                  <th className="pb-3 px-2">Owner / Nyir'imodoka</th>
                  <th className="pb-3 px-2">Phone / Telephone</th>
                  <th className="pb-3 px-2">Notes / Ibindi</th>
                  {isAdmin && <th className="pb-3 px-2">Billing / Ubwishyu</th>}
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
                        <button
                          onClick={() => togglePostpaid(c)}
                          title="Click to switch billing / Kanda uhindure"
                          className="focus:outline-none"
                        >
                          {c.is_postpaid
                            ? <Badge tone="amber">Pay-later / Nyuma</Badge>
                            : <Badge tone="green">Prepaid / Ako kanya</Badge>}
                        </button>
                      </td>
                    )}
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
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openBalance(c)}
                            aria-label="View balance"
                            title="Balance / Ideni"
                            className="p-1.5 text-gray-400 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <IconWallet className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteCar(c.id)}
                            aria-label="Remove car"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <IconTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {cars.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 4} className="text-center py-8 text-gray-400">
                      No cars / Nta modoka
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Balance / pay-later settlement modal (admin) ──────────────────── */}
      <Modal
        open={balanceCar !== null}
        onClose={closeBalance}
        title={balanceCar ? `${balanceCar.plate_number} · Balance / Ideni` : ""}
      >
        {balanceLoading ? (
          <Loading />
        ) : balance ? (
          <div className="space-y-5">
            {/* Outstanding headline */}
            <div className="text-center py-2">
              <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${
                outstanding > 0 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
              }`}>
                <IconWallet className="w-6 h-6" />
              </div>
              <p className="text-sm text-gray-500">Outstanding / Umwenda usigaye</p>
              <p className={`text-4xl font-bold mt-1 ${outstanding > 0 ? "text-red-600" : "text-green-700"}`}>
                {rwf(balance.balance.outstanding)}
              </p>
              <div className="mt-2 flex justify-center">
                {balance.balance.is_postpaid
                  ? <Badge tone="amber">Pay-later / Nyuma</Badge>
                  : <Badge tone="green">Prepaid / Ako kanya</Badge>}
              </div>
            </div>

            {/* Summary grid */}
            <div className="bg-gray-50 rounded-xl divide-y divide-gray-100 text-sm">
              {[
                ["Times charged / Inshuro yasharijwe", String(balance.balance.times_charged)],
                ["Total charged / Yose hamwe", rwf(balance.balance.total_charged)],
                ["Total paid / Yishyuwe", rwf(balance.balance.total_paid)],
                ["Payments / Ubwishyu", String(balance.balance.times_paid)],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between px-4 py-2.5">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-gray-900">{val}</span>
                </div>
              ))}
            </div>

            {/* Record a payment — only when there's a balance to settle */}
            {outstanding > 0 && (
              <div className="p-4 bg-green-50/60 rounded-xl space-y-3">
                <p className="text-sm font-semibold text-gray-700">Record payment / Andika ubwishyu</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Amount (Rwf) / Amafaranga"
                    type="number"
                    min={0}
                    placeholder={`Max ${Math.round(outstanding).toLocaleString()}`}
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                  />
                  <Input
                    label="Note / Icyitonderwa (si ngombwa)"
                    value={payNote}
                    onChange={e => setPayNote(e.target.value)}
                  />
                </div>
                <Button className="w-full" onClick={handlePay} disabled={paying || !payAmount}>
                  <IconCheck className="w-4 h-4" />
                  {paying ? "Tegereza..." : "Record / Andika"}
                </Button>
              </div>
            )}

            {/* Payment history */}
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Payment history / Amateka y'ubwishyu
              </p>
              {balance.payments.length === 0 ? (
                <p className="text-sm text-gray-400 py-3 text-center bg-gray-50 rounded-xl">
                  No payments yet / Nta bwishyu burakorwa
                </p>
              ) : (
                <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 max-h-52 overflow-y-auto">
                  {balance.payments.map(p => (
                    <div key={p.id} className="flex justify-between items-start px-3 py-2.5 text-sm">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-400">
                          {new Date(p.paid_at).toLocaleString()}
                        </p>
                        {p.note && <p className="text-gray-500 truncate">{p.note}</p>}
                      </div>
                      <span className="font-semibold text-green-700 shrink-0 ml-3">{rwf(p.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">No data / Nta makuru</p>
        )}
      </Modal>
    </div>
  );
};
