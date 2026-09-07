import { useState, useEffect, useCallback } from "react";
import { successToast, errorToast } from "@/utils/toast";
import api from "@/utils/axios";
import { safeArray } from "@/utils/safeArray";
import { unwrapPage, emptyPageMeta, type PageMeta } from "@/utils/pagination";
import type { Car } from "./useStaff";

export type { Car };

export interface CarPayload {
  plate_number: string;
  owner_name?: string;
  phone_number?: string;
  optional_info?: string;
  unique_price?: string; // admin only — ignored by the API for staff requests
  is_postpaid?: boolean; // admin only — flag a car as pay-later
}

// ─── Postpaid balance / payments ──────────────────────────────────────────────

export interface CarBalance {
  times_charged: number;
  total_charged: string;
  total_paid: string;
  outstanding: string;
  times_paid: number;
  is_postpaid: boolean;
}

export interface CarPayment {
  id: number;
  car: number;
  amount: string;
  recorded_by: number;
  recorded_by_name?: string;
  note: string | null;
  paid_at: string;
}

export interface CarBalanceResponse {
  balance: CarBalance;
  payments: CarPayment[];
}

// ─── Owner type-ahead (for report filtering) ──────────────────────────────────

export interface CarOwner {
  owner_name: string;
  car_count: number;
}

// Distinct car-owner names for report filters. `searchOwners` hits
// GET /api/cars/owners/?search=... (case-insensitive substring; omit to list all).
export const useCarOwners = () => {
  const [owners, setOwners] = useState<CarOwner[]>([]);

  const searchOwners = useCallback(async (search: string) => {
    try {
      const res = await api.get("api/cars/owners/", {
        params: search ? { search } : {},
      });
      setOwners(safeArray<CarOwner>(res.data?.data));
    } catch {
      setOwners([]);
    }
  }, []);

  return { owners, searchOwners };
};

// ─── useCars — shared /api/cars/ CRUD (admin + staff, delete is admin-only) ───

export const useCars = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState<PageMeta>(emptyPageMeta);

  const fetchCars = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const res = await api.get("api/cars/", { params: { page } });
      const pg = unwrapPage<Car>(res.data?.data);
      setCars(pg.results);
      setMeta(pg);
    } catch {
      errorToast("Failed to load cars");
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCars(1); }, [fetchCars]);

  const createCar = async (payload: CarPayload): Promise<boolean> => {
    try {
      const res = await api.post("api/cars/", payload);
      setCars(prev => [...prev, res.data.data]);
      setMeta(m => ({ ...m, count: m.count + 1 }));
      successToast("Car added / Imodoka yanditswe");
      return true;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to add car / Byanze");
      return false;
    }
  };

  const updateCar = async (id: number, payload: Partial<CarPayload>): Promise<boolean> => {
    try {
      const res = await api.patch(`api/cars/${id}/`, payload);
      setCars(prev => prev.map(c => c.id === id ? res.data.data : c));
      successToast("Car updated / Imodoka yahinduwe");
      return true;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to update car");
      return false;
    }
  };

  const deleteCar = async (id: number): Promise<void> => {
    try {
      await api.delete(`api/cars/${id}/`);
      setCars(prev => prev.filter(c => c.id !== id));
      setMeta(m => ({ ...m, count: Math.max(0, m.count - 1) }));
      successToast("Car deleted / Imodoka yasibwe");
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to delete car");
    }
  };

  // Admin-only: outstanding balance + payment history for a car.
  const fetchBalance = async (id: number): Promise<CarBalanceResponse | null> => {
    try {
      const res = await api.get(`api/cars/${id}/balance/`);
      return res.data.data as CarBalanceResponse;
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to load balance / Byanze");
      return null;
    }
  };

  // Admin-only: record a settlement against a car's oldest unpaid sessions (FIFO).
  // Returns the refreshed balance so the caller can re-render without a second fetch.
  const payCar = async (
    id: number,
    amount: string,
    note?: string
  ): Promise<CarBalanceResponse | null> => {
    try {
      await api.post(`api/cars/${id}/pay/`, { amount, note: note || undefined });
      successToast("Payment recorded / Ubwishyu bwanditswe");
      return await fetchBalance(id);
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to record payment / Byanze");
      return null;
    }
  };

  return {
    cars,
    loading,
    page: meta.page,
    totalPages: meta.total_pages,
    count: meta.count,
    changePage: fetchCars,
    fetchCars,
    createCar,
    updateCar,
    deleteCar,
    fetchBalance,
    payCar,
  };
};
