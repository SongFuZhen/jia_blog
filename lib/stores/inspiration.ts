import { create } from "zustand";
import { inspirationsRepo } from "@/lib/repository";
import type { Inspiration } from "@/lib/types";

type NewInspiration = Parameters<typeof inspirationsRepo.create>[0];

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
    const item = await inspirationsRepo.create(data);
    set((s) => ({ items: [item, ...s.items] }));
  },

  remove: async (id) => {
    await inspirationsRepo.remove(id);
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },
}));
