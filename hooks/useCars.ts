import { useState, useEffect, useCallback } from "react";
import { successToast, errorToast } from "@/utils/toast";
import api from "@/utils/axios";
import { safeArray } from "@/utils/safeArray";
import type { Car } from "./useStaff";

export type { Car };

export interface CarPayload {
  plate_number: string;
  owner_name?: string;
  phone_number?: string;
  optional_info?: string;
  unique_price?: string; // admin only — ignored by the API for staff requests
}

// ─── useCars — shared /api/cars/ CRUD (admin + staff, delete is admin-only) ───

export const useCars = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCars = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("api/cars/");
      setCars(safeArray<Car>(res.data?.data));
    } catch {
      errorToast("Failed to load cars");
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCars(); }, [fetchCars]);

  const createCar = async (payload: CarPayload): Promise<boolean> => {
    try {
      const res = await api.post("api/cars/", payload);
      setCars(prev => [...prev, res.data.data]);
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
      successToast("Car deleted / Imodoka yasibwe");
    } catch (e: any) {
      errorToast(e?.response?.data?.message || "Failed to delete car");
    }
  };

  return { cars, loading, fetchCars, createCar, updateCar, deleteCar };
};
