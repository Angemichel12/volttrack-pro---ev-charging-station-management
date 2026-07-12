import React, { useMemo, useState } from "react";
import { Card, StatCard, Button, Input, Select, Modal, PageHeader, EmptyState, Table, TableSkeleton } from "../components/Shared";
import { IconWallet, IconPlus, IconTrash, IconPencil, IconMoney, IconChart } from "../components/Icons";
import { useExpenses, type Expense, type ExpensePayload } from "../hooks/useExpenses";
import { useAdminStations } from "../hooks/useAdmin";

const emptyForm: ExpensePayload = {
  station: 0,
  description: "",
  amount_vat_exclusive: "",
  input_vat: "",
};

export const ExpensesPage: React.FC = () => {
  const { stations } = useAdminStations();

  const [stationFilter, setStationFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { expenses, loading, createExpense, updateExpense, deleteExpense } = useExpenses({
    station: stationFilter ? parseInt(stationFilter) : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpensePayload>(emptyForm);
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const amount = expenses.reduce((s, x) => s + parseFloat(x.amount_vat_exclusive || "0"), 0);
    const vat = expenses.reduce((s, x) => s + parseFloat(x.input_vat || "0"), 0);
    return { amount, vat, total: amount + vat };
  }, [expenses]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (x: Expense) => {
    setEditing(x);
    setForm({
      station: x.station,
      description: x.description,
      amount_vat_exclusive: x.amount_vat_exclusive,
      input_vat: x.input_vat,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.station || !form.description.trim() || !form.amount_vat_exclusive) return;
    setSaving(true);
    const ok = editing
      ? await updateExpense(editing.id, form)
      : await createExpense({ ...form, input_vat: form.input_vat || "0" });
    setSaving(false);
    if (ok) setModalOpen(false);
  };

  const handleDelete = (x: Expense) => {
    if (window.confirm(`Delete expense "${x.description}"? This cannot be undone.`)) {
      deleteExpense(x.id);
    }
  };

  const rwf = (v: number) => `Rwf ${Math.round(v).toLocaleString()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        subtitle="Track per-station operating costs"
        actions={
          <Button onClick={openAdd}>
            <IconPlus className="w-4 h-4" /> Add Expense
          </Button>
        }
      />

      {/* ── Filters ───────────────────────────────────────────────── */}
      <Card padded>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select label="Station" value={stationFilter} onChange={e => setStationFilter(e.target.value)}>
            <option value="">All stations</option>
            {stations.map(st => (
              <option key={st.id} value={st.id}>{st.name}</option>
            ))}
          </Select>
          <Input label="From" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <Input label="To" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
      </Card>

      {/* ── Totals ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Amount (VAT excl.)" value={rwf(totals.amount)} icon={<IconMoney className="w-5 h-5" />} />
        <StatCard label="Input VAT" value={rwf(totals.vat)} icon={<IconChart className="w-5 h-5" />} />
        <StatCard label="Total outlay" value={rwf(totals.total)} icon={<IconWallet className="w-5 h-5" />} tone="red" />
      </div>

      {/* ── List ──────────────────────────────────────────────────── */}
      {loading ? (
        <Card><TableSkeleton rows={6} cols={6} /></Card>
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={<IconWallet className="w-6 h-6" />}
          title="No expenses recorded"
          hint="Expenses you record will appear here. Use the filters above to narrow by station or date."
          action={<Button onClick={openAdd}><IconPlus className="w-4 h-4" /> Add Expense</Button>}
        />
      ) : (
        <Card>
          <Table headers={["Date", "Station", "Description", "Amount (VAT excl.)", "VAT", "Total", ""]}>
            {expenses.map(x => {
              const amount = parseFloat(x.amount_vat_exclusive || "0");
              const vat = parseFloat(x.input_vat || "0");
              return (
                <tr key={x.id} className="text-sm">
                  <td className="py-3 px-2 text-gray-500 whitespace-nowrap">
                    {new Date(x.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-2 text-gray-500">{x.station_name}</td>
                  <td className="py-3 px-2 font-medium text-gray-900">{x.description}</td>
                  <td className="py-3 px-2 whitespace-nowrap">{rwf(amount)}</td>
                  <td className="py-3 px-2 text-gray-500 whitespace-nowrap">{rwf(vat)}</td>
                  <td className="py-3 px-2 font-semibold whitespace-nowrap">{rwf(amount + vat)}</td>
                  <td className="py-3 px-2">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(x)}
                        aria-label="Edit expense"
                        className="p-1.5 text-gray-400 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <IconPencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(x)}
                        aria-label="Delete expense"
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        </Card>
      )}

      {/* ── Add / Edit modal ──────────────────────────────────────── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Expense" : "New Expense"}>
        <div className="space-y-4">
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
          <Input
            label="Description"
            placeholder="e.g. Generator fuel"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Amount (VAT exclusive)"
              type="number"
              min={0}
              placeholder="e.g. 25000"
              value={form.amount_vat_exclusive}
              onChange={e => setForm({ ...form, amount_vat_exclusive: e.target.value })}
            />
            <Input
              label="Input VAT"
              type="number"
              min={0}
              placeholder="e.g. 4500"
              value={form.input_vat}
              onChange={e => setForm({ ...form, input_vat: e.target.value })}
            />
          </div>
          {!editing && (
            <p className="text-xs text-gray-400">The date is recorded automatically when the expense is saved.</p>
          )}
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saving || !form.station || !form.description.trim() || !form.amount_vat_exclusive}
          >
            {saving ? "Saving..." : editing ? "Save Changes" : "Record Expense"}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
