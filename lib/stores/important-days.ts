import { create } from "zustand";
import { importantDaysRepo } from "@/lib/repository";
import type { ImportantDay } from "@/lib/important-days";

interface ImportantDaysState {
  days: ImportantDay[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  add: (data: Omit<ImportantDay, "id">) => Promise<void>;
  update: (id: string, patch: Partial<Omit<ImportantDay, "id">>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

/** 首次使用时播种：两个生日 + 原文案页里的纪念日，避免数据丢失 */
const SEED: Omit<ImportantDay, "id">[] = [
  { name: "小佳佳生日", kind: "birthday", isLunar: true, month: 4, day: 7, emoji: "🎂" },
  { name: "老公生日", kind: "birthday", isLunar: true, month: 7, day: 30, emoji: "🎂" },
  { name: "在一起纪念日", kind: "anniversary", isLunar: false, month: 10, day: 7, emoji: "💞" },
  { name: "情人节", kind: "anniversary", isLunar: false, month: 2, day: 14, emoji: "🌹" },
  { name: "520", kind: "anniversary", isLunar: false, month: 5, day: 20, emoji: "❤️" },
];

/** hydrate 的共享 in-flight promise，防止并发调用重复播种 */
let hydratePromise: Promise<void> | null = null;

export const useImportantDaysStore = create<ImportantDaysState>((set, get) => ({
  days: [],
  hydrated: false,

  // 首页多个组件会同时触发 hydrate，这里用共享 promise 去重，避免并发播种出重复数据
  hydrate: () => {
    const pending = hydratePromise;
    if (pending) return pending;
    hydratePromise = (async () => {
      let list = await importantDaysRepo.list();
      if (list.length === 0) {
        for (const s of SEED) await importantDaysRepo.create(s);
        list = await importantDaysRepo.list();
      }
      set({ days: list, hydrated: true });
    })();
    return hydratePromise;
  },

  add: async (data) => {
    const item = await importantDaysRepo.create(data);
    set({ days: [...get().days, item] });
  },

  update: async (id, patch) => {
    const updated = await importantDaysRepo.update(id, patch);
    if (updated) set({ days: get().days.map((d) => (d.id === id ? updated : d)) });
  },

  remove: async (id) => {
    await importantDaysRepo.remove(id);
    set({ days: get().days.filter((d) => d.id !== id) });
  },
}));
