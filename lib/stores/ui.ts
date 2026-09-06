import { create } from "zustand";
import type { RecordType } from "@/lib/types";

interface ComposeState {
  open: boolean;
  type: RecordType;
  openCompose: (type?: RecordType) => void;
  closeCompose: () => void;
}

/** 全局「快速记录」编辑器状态：底部 + 与首页快捷入口共用 */
export const useComposeStore = create<ComposeState>((set) => ({
  open: false,
  type: "diary",
  openCompose: (type) => set({ open: true, type: type ?? "diary" }),
  closeCompose: () => set({ open: false }),
}));
