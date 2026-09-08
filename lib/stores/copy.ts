import { create } from "zustand";
import { copyRepo } from "@/lib/repository";
import { DEFAULT_COPY_LIBRARY } from "@/lib/surprises";
import type { CopyLibrary } from "@/lib/types";

interface CopyState {
  /** 界面文案库；未加载完成时为默认值（与 SSR 渲染一致，避免水合不一致） */
  library: CopyLibrary;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  save: (library: CopyLibrary) => Promise<void>;
}

export const useCopyStore = create<CopyState>((set, get) => ({
  library: DEFAULT_COPY_LIBRARY,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const library = await copyRepo.load();
    set({ library, hydrated: true });
  },

  save: async (library) => {
    const prev = get().library;
    set({ library });
    try {
      await copyRepo.save(library);
    } catch (err) {
      set({ library: prev });
      throw err;
    }
  },
}));
