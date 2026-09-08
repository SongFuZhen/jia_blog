import { create } from "zustand";
import { genId, foodsRepo } from "@/lib/repository";
import type { Food } from "@/lib/types";

type NewFood = Omit<Food, "id"> & { id?: string };

interface FoodState {
  foods: Food[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  add: (data: NewFood) => Promise<void>;
  update: (id: string, patch: Partial<Omit<Food, "id">>) => Promise<void>;
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

  update: async (id, patch) => {
    const prev = get().foods;
    set({ foods: prev.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
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
