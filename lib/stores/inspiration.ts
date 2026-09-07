import { create } from "zustand";
import { genId, inspirationsRepo } from "@/lib/repository";
import type { Inspiration } from "@/lib/types";

type NewInspiration = Omit<Inspiration, "id"> & { id?: string };

interface InspirationState {
  items: Inspiration[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  add: (data: NewInspiration) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useInspirationStore = create<InspirationState>((set, get) => ({
  items: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const items = await inspirationsRepo.list();
    set({ items, hydrated: true });
  },

  add: async (data) => {
    const item: Inspiration = { ...data, id: data.id ?? genId() } as Inspiration;
    const prev = get().items;
    set({ items: [item, ...prev] });
    try {
      await inspirationsRepo.create(item);
    } catch (err) {
      set({ items: prev });
      throw err;
    }
  },

  remove: async (id) => {
    const prev = get().items;
    set({ items: prev.filter((i) => i.id !== id) });
    try {
      await inspirationsRepo.remove(id);
    } catch (err) {
      set({ items: prev });
      throw err;
    }
  },
}));
