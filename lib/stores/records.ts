import { create } from "zustand";
import { genId, recordsRepo } from "@/lib/repository";
import type { LifeRecord } from "@/lib/types";

type NewLifeRecord = Omit<LifeRecord, "id"> & { id?: string };

function sortByCreatedDesc(records: LifeRecord[]): LifeRecord[] {
  return [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

interface RecordsState {
  records: LifeRecord[];
  hydrated: boolean;
  /** 首次使用时从仓库读取（含 seed 初始化），组件挂载后调用 */
  hydrate: () => Promise<void>;
  /** 乐观更新：先改界面，后台写库，失败回滚 */
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
    const record: LifeRecord = { ...data, id: data.id ?? genId() } as LifeRecord;
    const prev = get().records;
    set({ records: sortByCreatedDesc([record, ...prev]) });
    try {
      await recordsRepo.create(record);
      return record;
    } catch (err) {
      set({ records: prev }); // 写库失败回滚
      throw err;
    }
  },

  updateRecord: async (id, patch) => {
    const prev = get().records;
    set({
      records: sortByCreatedDesc(
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      ),
    });
    try {
      const updated = await recordsRepo.update(id, patch);
      if (updated) {
        set({
          records: sortByCreatedDesc(
            get().records.map((r) => (r.id === id ? updated : r)),
          ),
        });
      }
    } catch (err) {
      set({ records: prev });
      throw err;
    }
  },

  removeRecord: async (id) => {
    const prev = get().records;
    set({ records: prev.filter((r) => r.id !== id) });
    try {
      await recordsRepo.remove(id);
    } catch (err) {
      set({ records: prev });
      throw err;
    }
  },
}));
