import { create } from "zustand";
import { recordsRepo } from "@/lib/repository";
import type { LifeRecord } from "@/lib/types";

type NewLifeRecord = Parameters<typeof recordsRepo.create>[0];

function sortByCreatedDesc(records: LifeRecord[]): LifeRecord[] {
  return [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

interface RecordsState {
  records: LifeRecord[];
  hydrated: boolean;
  /** 首次使用时从仓库读取（含 seed 初始化），组件挂载后调用 */
  hydrate: () => Promise<void>;
  addRecord: (data: NewLifeRecord) => Promise<LifeRecord>;
  updateRecord: (
    id: string,
    patch: Partial<Omit<LifeRecord, "id">>,
  ) => Promise<void>;
  removeRecord: (id: string) => Promise<void>;
}

export const useRecordsStore = create<RecordsState>((set, get) => ({
  records: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const records = await recordsRepo.list();
    set({ records: sortByCreatedDesc(records), hydrated: true });
  },

  addRecord: async (data) => {
    const record = await recordsRepo.create(data);
    set((s) => ({ records: sortByCreatedDesc([record, ...s.records]) }));
    return record;
  },

  updateRecord: async (id, patch) => {
    const updated = await recordsRepo.update(id, patch);
    if (!updated) return;
    set((s) => ({
      records: sortByCreatedDesc(
        s.records.map((r) => (r.id === id ? updated : r)),
      ),
    }));
  },

  removeRecord: async (id) => {
    await recordsRepo.remove(id);
    set((s) => ({ records: s.records.filter((r) => r.id !== id) }));
  },
}));
