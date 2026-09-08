import { create } from "zustand";
import { genId, showsRepo } from "@/lib/repository";
import type { Show } from "@/lib/types";

type NewShow = Omit<Show, "id"> & { id?: string };

interface ShowState {
  shows: Show[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  add: (data: NewShow) => Promise<void>;
  update: (id: string, patch: Partial<Omit<Show, "id">>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useShowStore = create<ShowState>((set, get) => ({
  shows: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const shows = await showsRepo.list();
    set({ shows, hydrated: true });
  },

  add: async (data) => {
    const show: Show = { ...data, id: data.id ?? genId() } as Show;
    const prev = get().shows;
    set({ shows: [show, ...prev] });
    try {
      await showsRepo.create(show);
    } catch (err) {
      set({ shows: prev });
      throw err;
    }
  },

  update: async (id, patch) => {
    const prev = get().shows;
    set({ shows: prev.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
    try {
      const updated = await showsRepo.update(id, patch);
      if (updated) {
        set({ shows: get().shows.map((s) => (s.id === id ? updated : s)) });
      }
    } catch (err) {
      set({ shows: prev });
      throw err;
    }
  },

  remove: async (id) => {
    const prev = get().shows;
    set({ shows: prev.filter((s) => s.id !== id) });
    try {
      await showsRepo.remove(id);
    } catch (err) {
      set({ shows: prev });
      throw err;
    }
  },
}));
