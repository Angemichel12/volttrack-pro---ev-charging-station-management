import { useState, useEffect, useCallback } from "react";
import { successToast, errorToast } from "@/utils/toast";
import api from "@/utils/axios";
import { safeArray } from "@/utils/safeArray";

// ─── Types (per /api/expenses/ contract — admin only) ─────────────────────────

export interface Expense {
  id: number;
  station: number;
  station_name: string;
  description: string;
  amount_vat_exclusive: string;
  input_vat: string;
  date: string; // auto-set server-side on creation
}

export interface ExpensePayload {
  station: number;
  description: string;
  amount_vat_exclusive: string;
  input_vat: string;
}

export interface ExpenseFilters {
  station?: number;
  date_from?: string; // YYYY-MM-DD, inclusive
  date_to?: string;
}

export const useExpenses = (filters: ExpenseFilters) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const { station, date_from, date_to } = filters;

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (station) params.set("station", String(station));
    if (date_from) params.set("date_from", date_from);
    if (date_to) params.set("date_to", date_to);
    const qs = params.toString();
    try {
      const res = await api.get(`api/expenses/${qs ? `?${qs}` : ""}`);
      setExpenses(safeArray<Expense>(res.data?.data));
    } catch {
      errorToast("Failed to load expenses");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [station, date_from, date_to]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const createExpense = async (payload: ExpensePayload): Promise<boolean> => {
    try {
      const res = await api.post("api/expenses/", payload);
      setExpenses(prev => [res.data.data, ...prev]);
      successToast("Expense recorded");
      return true;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to record expense");
      return false;
    }
  };

  const updateExpense = async (id: number, payload: Partial<ExpensePayload>): Promise<boolean> => {
    try {
      const res = await api.patch(`api/expenses/${id}/`, payload);
      setExpenses(prev => prev.map(x => (x.id === id ? res.data.data : x)));
      successToast("Expense updated");
      return true;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to update expense");
      return false;
    }
  };

  const deleteExpense = async (id: number): Promise<void> => {
    try {
      await api.delete(`api/expenses/${id}/`);
      setExpenses(prev => prev.filter(x => x.id !== id));
      successToast("Expense deleted");
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to delete expense");
    }
  };

  return { expenses, loading, refresh: fetchExpenses, createExpense, updateExpense, deleteExpense };
};
