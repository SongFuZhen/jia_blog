import { create } from "zustand";
import { genId, foodsRepo } from "@/lib/repository";
import type { Food, FoodVisit } from "@/lib/types";

type NewFood = Omit<Food, "id"> & { id?: string };

/** 更新补丁：普通字段 + 就餐记录的增量操作（服务端权威合并，避免覆盖已有 visit） */
type FoodPatch = Partial<Omit<Food, "id">> & {
  addVisit?: FoodVisit;
  updateVisit?: { id: string; changes: Partial<FoodVisit> };
  removeVisitId?: string;
};

interface FoodState {
  foods: Food[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  add: (data: NewFood) => Promise<void>;
  update: (id: string, patch: FoodPatch) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useFoodStore = create<FoodState>((set, get) => ({
  foods: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const foods = await foodsRepo.list();
    set({ foods, hydrated: true });
  },

  add: async (data) => {
    const food: Food = { ...data, id: data.id ?? genId() } as Food;
    const prev = get().foods;
    set({ foods: [food, ...prev] });
    try {
      await foodsRepo.create(food);
    } catch (err) {
      set({ foods: prev });
      throw err;
    }
  },

  update: async (id, patch: FoodPatch) => {
    const prev = get().foods;
    // 就餐记录用增量操作，乐观更新也按服务端逻辑合并，避免覆盖已有的 visit
    const optimistic = prev.map((f) => {
      if (f.id !== id) return f;
      const { addVisit, updateVisit, removeVisitId, ...restPatch } = patch;
      let nf: Food = { ...f, ...restPatch } as Food;
      if (addVisit) {
        nf = { ...nf, visits: [...(f.visits ?? []), addVisit] };
      }
      if (updateVisit) {
        nf = {
          ...nf,
          visits: (f.visits ?? []).map((v) =>
            v.id === updateVisit.id ? { ...v, ...updateVisit.changes } : v,
          ),
        };
      }
      if (removeVisitId) {
        nf = { ...nf, visits: (f.visits ?? []).filter((v) => v.id !== removeVisitId) };
      }
      return nf;
    });
    set({ foods: optimistic });
    try {
      const updated = await foodsRepo.update(id, patch);
      if (updated) {
        set({ foods: get().foods.map((f) => (f.id === id ? updated : f)) });
      }
    } catch (err) {
      set({ foods: prev });
      throw err;
    }
  },

  remove: async (id) => {
    const prev = get().foods;
    set({ foods: prev.filter((f) => f.id !== id) });
    try {
      await foodsRepo.remove(id);
    } catch (err) {
      set({ foods: prev });
      throw err;
    }
  },
}));
