import { create } from "zustand";
import {
  genId,
  privateDiaryRepo,
  weightLogsRepo,
  periodLogsRepo,
} from "@/lib/repository";
import type { PeriodLog, PrivateDiary, WeightLog } from "@/lib/types";

type NewWeightLog = Omit<WeightLog, "id"> & { id?: string };
type NewPrivateDiary = Omit<PrivateDiary, "id"> & { id?: string };

interface PrivateState {
  /** 锁定状态：解锁后 5 分钟 idle / 切 Tab 会重新上锁（useAutoLock 监听） */
  locked: boolean;
  weightLogs: WeightLog[];
  periodLogs: PeriodLog[];
  diaries: PrivateDiary[];
  hydrated: boolean;
  unlock: () => void;
  /** 上锁并清空内存数据 */
  lock: () => void;
  hydrate: () => Promise<void>;
  addWeightLog: (data: NewWeightLog) => Promise<void>;
  addPeriodLog: (data: Omit<PeriodLog, "id">) => Promise<void>;
  addDiary: (data: NewPrivateDiary) => Promise<void>;
}

export const usePrivateStore = create<PrivateState>((set, get) => ({
  locked: true,
  weightLogs: [],
  periodLogs: [],
  diaries: [],
  hydrated: false,

  unlock: () => set({ locked: false }),
  /** 上锁并清空内存中的私密数据 */
  lock: () =>
    set({ locked: true, weightLogs: [], periodLogs: [], diaries: [], hydrated: false }),

  /** 仅在解锁后才允许 hydrate，避免私密数据提前进内存 */
  hydrate: async () => {
    if (get().hydrated || get().locked) return;
    const [weightLogs, periodLogs, diaries] = await Promise.all([
      weightLogsRepo.list(),
      periodLogsRepo.list(),
      privateDiaryRepo.list(),
    ]);
    set({
      weightLogs: [...weightLogs].sort((a, b) => a.date.localeCompare(b.date)),
      periodLogs: [...periodLogs].sort((a, b) => b.start.localeCompare(a.start)),
      diaries,
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
}));
