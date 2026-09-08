import { create } from "zustand";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  /** 危险操作（删除等）确认键显示为红色 */
  danger?: boolean;
}

interface ConfirmState {
  open: boolean;
  options: ConfirmOptions | null;
  resolve: ((value: boolean) => void) | null;
  /** 弹出确认框，resolve(true/false) */
  ask: (options: ConfirmOptions) => Promise<boolean>;
  answer: (value: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  open: false,
  options: null,
  resolve: null,
  ask: (options) =>
    new Promise<boolean>((resolve) => {
      set({ open: true, options, resolve });
    }),
  answer: (value) => {
    get().resolve?.(value);
    set({ open: false, options: null, resolve: null });
  },
}));

/** 组件里使用：const confirm = useConfirm(); → await confirm({ title, ... }) */
export function useConfirm() {
  return useConfirmStore((s) => s.ask);
}
