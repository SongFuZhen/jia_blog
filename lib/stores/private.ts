import { create } from "zustand";
import {
  genId,
  privateDiaryRepo,
  secretItemsRepo,
  weightLogsRepo,
  periodLogsRepo,
} from "@/lib/repository";
import type {
  PeriodLog,
  PrivateDiary,
  SecretItem,
  WeightLog,
} from "@/lib/types";

type NewWeightLog = Omit<WeightLog, "id"> & { id?: string };
type NewPrivateDiary = Omit<PrivateDiary, "id"> & { id?: string };

interface PrivateState {
  /** 锁定状态：解锁后 5 分钟 idle / 切 Tab 会重新上锁（useAutoLock 监听） */
  locked: boolean;
  weightLogs: WeightLog[];
  periodLogs: PeriodLog[];
  diaries: PrivateDiary[];
  secrets: SecretItem[];
  hydrated: boolean;
  unlock: () => void;
  /** 上锁并清空内存数据 */
  lock: () => void;
  hydrate: () => Promise<void>;
  addWeightLog: (data: NewWeightLog) => Promise<void>;
  addPeriodLog: (data: Omit<PeriodLog, "id">) => Promise<void>;
  addDiary: (data: NewPrivateDiary) => Promise<void>;
  removeDiary: (id: string) => Promise<void>;
  addSecret: (text: string) => Promise<void>;
  toggleSecret: (id: string) => Promise<void>;
  removeSecret: (id: string) => Promise<void>;
}

export const usePrivateStore = create<PrivateState>((set, get) => ({
  locked: true,
  weightLogs: [],
  periodLogs: [],
  diaries: [],
  secrets: [],
  hydrated: false,

  unlock: () => set({ locked: false }),
  /** 上锁并清空内存中的私密数据 */
  lock: () =>
    set({
      locked: true,
      weightLogs: [],
      periodLogs: [],
      diaries: [],
      secrets: [],
      hydrated: false,
    }),

  /** 仅在解锁后才允许 hydrate，避免私密数据提前进内存 */
  hydrate: async () => {
    if (get().hydrated || get().locked) return;
    const [weightLogs, periodLogs, diaries, secrets] = await Promise.all([
      weightLogsRepo.list(),
      periodLogsRepo.list(),
      privateDiaryRepo.list(),
      secretItemsRepo.list(),
    ]);
    set({
      weightLogs: [...weightLogs].sort((a, b) => a.date.localeCompare(b.date)),
      periodLogs: [...periodLogs].sort((a, b) => b.start.localeCompare(a.start)),
      diaries,
      secrets,
      hydrated: true,
    });
  },

  addWeightLog: async (data) => {
    const log: WeightLog = { ...data, id: data.id ?? genId() } as WeightLog;
    const prev = get().weightLogs;
    set({
      weightLogs: [...prev, log].sort((a, b) => a.date.localeCompare(b.date)),
    });
    try {
      await weightLogsRepo.create(log);
    } catch (err) {
      set({ weightLogs: prev });
      throw err;
    }
  },

  addPeriodLog: async (data) => {
    const log: PeriodLog = { ...data, id: genId() };
    const prev = get().periodLogs;
    set({
      periodLogs: [log, ...prev].sort((a, b) => b.start.localeCompare(a.start)),
    });
    try {
      await periodLogsRepo.create(log);
    } catch (err) {
      set({ periodLogs: prev });
      throw err;
    }
  },

  addDiary: async (data) => {
    const diary: PrivateDiary = { ...data, id: data.id ?? genId() } as PrivateDiary;
    const prev = get().diaries;
    set({ diaries: [diary, ...prev] });
    try {
      await privateDiaryRepo.create(diary);
    } catch (err) {
      set({ diaries: prev });
      throw err;
    }
  },

  removeDiary: async (id) => {
    const prev = get().diaries;
    set({ diaries: prev.filter((d) => d.id !== id) });
    try {
      await privateDiaryRepo.remove(id);
    } catch (err) {
      set({ diaries: prev });
      throw err;
    }
  },

  addSecret: async (text) => {
    const item: SecretItem = {
      id: genId(),
      text,
      done: false,
      createdAt: new Date().toISOString(),
    };
    const prev = get().secrets;
    set({ secrets: [...prev, item] });
    try {
      await secretItemsRepo.create(item);
    } catch (err) {
      set({ secrets: prev });
      throw err;
    }
  },

  toggleSecret: async (id) => {
    const prev = get().secrets;
    const target = prev.find((s) => s.id === id);
    if (!target) return;
    set({ secrets: prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)) });
    try {
      await secretItemsRepo.update(id, { done: !target.done });
    } catch (err) {
      set({ secrets: prev });
      throw err;
    }
  },

  removeSecret: async (id) => {
    const prev = get().secrets;
    set({ secrets: prev.filter((s) => s.id !== id) });
    try {
      await secretItemsRepo.remove(id);
    } catch (err) {
      set({ secrets: prev });
      throw err;
    }
  },
}));
