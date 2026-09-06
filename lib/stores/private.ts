import { create } from "zustand";
import {
  privateDiaryRepo,
  weightLogsRepo,
  periodLogsRepo,
} from "@/lib/repository";
import type { PeriodLog, PrivateDiary, WeightLog } from "@/lib/types";

type NewWeightLog = Parameters<typeof weightLogsRepo.create>[0];
type NewPrivateDiary = Parameters<typeof privateDiaryRepo.create>[0];

interface PrivateState {
  /** 锁定状态：解锁后 5 分钟 idle / 切 Tab 会重新上锁（步骤 7 实现监听） */
  locked: boolean;
  weightLogs: WeightLog[];
  periodLogs: PeriodLog[];
  diaries: PrivateDiary[];
  hydrated: boolean;
  unlock: () => void;
  lock: () => void;
  hydrate: () => Promise<void>;
  addWeightLog: (data: NewWeightLog) => Promise<void>;
  addPeriodLog: (
    data: Omit<PeriodLog, "id">,
  ) => Promise<void>;
  addDiary: (data: NewPrivateDiary) => Promise<void>;
}

export const usePrivateStore = create<PrivateState>((set, get) => ({
  locked: true,
  weightLogs: [],
  periodLogs: [],
  diaries: [],
  hydrated: false,

  unlock: () => set({ locked: false }),
  lock: () => set({ locked: true }),

  /** 仅在解锁后才允许 hydrate，避免私密数据提前进内存 */
  hydrate: async () => {
    if (get().hydrated || get().locked) return;
    const [weightLogs, periodLogs, diaries] = await Promise.all([
      weightLogsRepo.list(),
      periodLogsRepo.list(),
      privateDiaryRepo.list(),
    ]);
    set({ weightLogs, periodLogs, diaries, hydrated: true });
  },

  addWeightLog: async (data) => {
    const log = await weightLogsRepo.create(data);
    set((s) => ({
      weightLogs: [...s.weightLogs, log].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    }));
  },

  addPeriodLog: async (data) => {
    const log = await periodLogsRepo.create(data);
    set((s) => ({
      periodLogs: [...s.periodLogs, log].sort((a, b) =>
        b.start.localeCompare(a.start),
      ),
    }));
  },

  addDiary: async (data) => {
    const diary = await privateDiaryRepo.create(data);
    set((s) => ({ diaries: [diary, ...s.diaries] }));
  },
}));
