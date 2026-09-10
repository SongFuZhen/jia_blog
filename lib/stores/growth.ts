import { create } from "zustand";
import { genId, growthRepo } from "@/lib/repository";
import type { CheckStatus, GrowthItem, GrowthSection } from "@/lib/types";

interface GrowthState {
  sections: GrowthSection[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  toggle: (sectionTitle: string, itemId: string) => Promise<void>;
  /** 循环任务打卡：再点一次同一状态 = 撤销当天的记录 */
  logCheck: (
    sectionTitle: string,
    itemId: string,
    date: string,
    status: CheckStatus,
  ) => Promise<void>;
  addItem: (sectionTitle: string, text: string, repeat?: boolean) => Promise<void>;
  updateItem: (
    sectionTitle: string,
    itemId: string,
    patch: Partial<Omit<GrowthItem, "id">>,
  ) => Promise<void>;
  removeItem: (sectionTitle: string, itemId: string) => Promise<void>;
  /** 编辑模式下调整顺序：delta 为 -1（上移）/ 1（下移） */
  moveItem: (sectionTitle: string, itemId: string, delta: number) => Promise<void>;
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
    const next = prev.map((s) => {
      if (s.title !== sectionTitle) return s;
      const items = [...s.items];
      const idx = items.findIndex((i) => i.id === itemId);
      if (idx === -1) return s;
      items[idx] = { ...items[idx], done: !items[idx].done };
      return { ...s, items };
    });
    await persistSections(set, get, next, prev);
  },

  logCheck: async (sectionTitle, itemId, date, status) => {
    const prev = get().sections;
    const next = prev.map((s) =>
      s.title !== sectionTitle
        ? s
        : {
            ...s,
            items: s.items.map((i) => {
              if (i.id !== itemId || !i.repeat) return i;
              const log = { ...(i.log ?? {}) };
              if (log[date] === status) delete log[date]; // 撤销
              else log[date] = status;
              return { ...i, log };
            }),
          },
    );
    await persistSections(set, get, next, prev);
  },

  addItem: async (sectionTitle, text, repeat = false) => {
    const prev = get().sections;
    const next = prev.map((s) =>
      s.title !== sectionTitle
        ? s
        : {
            ...s,
            items: [
              ...s.items,
              { id: genId(), text, done: false, repeat },
            ],
          },
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

  moveItem: async (sectionTitle, itemId, delta) => {
    const prev = get().sections;
    const next = prev.map((s) => {
      if (s.title !== sectionTitle) return s;
      const items = [...s.items];
      const idx = items.findIndex((i) => i.id === itemId);
      const to = idx + delta;
      if (idx === -1 || to < 0 || to >= items.length) return s;
      [items[idx], items[to]] = [items[to], items[idx]];
      return { ...s, items };
    });
    await persistSections(set, get, next, prev);
  },

  updateItem: async (sectionTitle, itemId, patch) => {
    const prev = get().sections;
    const next = prev.map((s) =>
      s.title !== sectionTitle
        ? s
        : {
            ...s,
            items: s.items.map((i) =>
              i.id === itemId ? { ...i, ...patch } : i,
            ),
          },
    );
    await persistSections(set, get, next, prev);
  },
}));
