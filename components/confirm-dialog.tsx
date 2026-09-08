"use client";

import { useConfirmStore } from "@/lib/stores/confirm";

/** 全局确认弹框（替代 window.confirm），挂载在 layout，配合 useConfirm() 使用 */
export function ConfirmDialogHost() {
  const open = useConfirmStore((s) => s.open);
  const options = useConfirmStore((s) => s.options);
  const answer = useConfirmStore((s) => s.answer);

  if (!open || !options) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-8">
      <div
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        onClick={() => answer(false)}
      />
      <div className="relative w-full max-w-[300px] rounded-[20px] bg-white p-5 shadow-[var(--shadow-soft-lg)] dark:bg-[#231B1E]">
        <h3 className="text-center text-[15.5px] font-semibold text-ink">
          {options.title}
        </h3>
        {options.message && (
          <p className="mt-1.5 text-center text-[12.5px] leading-relaxed text-ink-3">
            {options.message}
          </p>
        )}
        <div className="mt-4 flex gap-2.5">
          <button
            onClick={() => answer(false)}
            className="h-10 flex-1 rounded-full bg-cream text-[13.5px] text-ink-3 transition-colors hover:bg-card-hover"
          >
            {options.cancelText ?? "再想想"}
          </button>
          <button
            onClick={() => answer(true)}
            className={`h-10 flex-1 rounded-full text-[13.5px] font-medium text-white transition-colors ${
              options.danger
                ? "bg-[#E76F7B] hover:bg-[#D95F6B]"
                : "bg-[#E96882] hover:bg-[#D56983]"
            }`}
          >
            {options.confirmText ?? "确定"}
          </button>
        </div>
      </div>
    </div>
  );
}
