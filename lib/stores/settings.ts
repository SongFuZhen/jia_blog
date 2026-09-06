import { create } from "zustand";
import { settingsRepo } from "@/lib/repository";
import type { Settings } from "@/lib/types";

interface SettingsState {
  settings: Settings;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  updateSettings: (patch: Partial<Omit<Settings, never>>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { nickname: "小佳佳" },
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    const settings = await settingsRepo.load();
    set({ settings, hydrated: true });
  },

  updateSettings: async (patch) => {
    const next = { ...get().settings, ...patch };
    await settingsRepo.save(next);
    set({ settings: next });
  },
}));
