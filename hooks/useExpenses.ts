import { useState, useEffect, useCallback } from "react";
import { successToast, errorToast } from "@/utils/toast";
import api from "@/utils/axios";
import { unwrapPage, emptyPageMeta, type PageMeta } from "@/utils/pagination";

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
  const [meta, setMeta] = useState<PageMeta>(emptyPageMeta);

  const { station, date_from, date_to } = filters;

  const fetchExpenses = useCallback(async (page: number = 1) => {
    setLoading(true);
    const params: Record<string, string | number> = { page };
    if (station) params.station = station;
    if (date_from) params.date_from = date_from;
    if (date_to) params.date_to = date_to;
    try {
      const res = await api.get("api/expenses/", { params });
      const pg = unwrapPage<Expense>(res.data?.data);
      setExpenses(pg.results);
      setMeta(pg);
    } catch {
      errorToast("Failed to load expenses");
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [station, date_from, date_to]);

  // Filters change → refetch from page 1.
  useEffect(() => { fetchExpenses(1); }, [fetchExpenses]);

  const createExpense = async (payload: ExpensePayload): Promise<boolean> => {
    try {
      const res = await api.post("api/expenses/", payload);
      setExpenses(prev => [res.data.data, ...prev]);
      setMeta(m => ({ ...m, count: m.count + 1 }));
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
      setMeta(m => ({ ...m, count: Math.max(0, m.count - 1) }));
      successToast("Expense deleted");
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to delete expense");
    }
  };

  return {
    expenses,
    loading,
    page: meta.page,
    totalPages: meta.total_pages,
    count: meta.count,
    changePage: fetchExpenses,
    refresh: fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
  };
};
