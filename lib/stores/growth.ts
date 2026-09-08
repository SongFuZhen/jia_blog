import { create } from "zustand";
import { genId, growthRepo } from "@/lib/repository";
import type { GrowthSection } from "@/lib/types";

interface GrowthState {
  sections: GrowthSection[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  toggle: (sectionTitle: string, itemId: string) => Promise<void>;
  addItem: (sectionTitle: string, text: string) => Promise<void>;
  removeItem: (sectionTitle: string, itemId: string) => Promise<void>;
}

/** 整包保存（数据量小）：乐观更新 + 失败回滚 */
async function persistSections(
  set: (partial: Partial<GrowthState>) => void,
  get: () => GrowthState,
  next: GrowthSection[],
  prev: GrowthSection[],
) {
  set({ sections: next });
  try {
    await growthRepo.save(next);
  } catch (err) {
    set({ sections: prev });
    throw err;
  }
}

export const useGrowthStore = create<GrowthState>((set, get) => ({
  sections: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const sections = await growthRepo.load();
    set({ sections, hydrated: true });
  },

  toggle: async (sectionTitle, itemId) => {
    const prev = get().sections;
    const next = prev.map((s) =>
      s.title !== sectionTitle
        ? s
        : {
            ...s,
            items: s.items.map((i) =>
              i.id === itemId ? { ...i, done: !i.done } : i,
            ),
          },
    );
    await persistSections(set, get, next, prev);
  },

  addItem: async (sectionTitle, text) => {
    const prev = get().sections;
    const next = prev.map((s) =>
      s.title !== sectionTitle
        ? s
        : { ...s, items: [...s.items, { id: genId(), text, done: false }] },
    );
    await persistSections(set, get, next, prev);
  },

  removeItem: async (sectionTitle, itemId) => {
    const prev = get().sections;
    const next = prev.map((s) =>
      s.title !== sectionTitle
        ? s
        : { ...s, items: s.items.filter((i) => i.id !== itemId) },
    );
    await persistSections(set, get, next, prev);
  },
}));
