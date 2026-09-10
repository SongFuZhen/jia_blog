"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * 通用底部抽屉（bottom sheet）。视觉与「看今朝」详情一致：
 * 遮罩 + 上滑白板，顶部留 ~48px，点遮罩 / 关闭按钮收起。
 * 表单内容作为 children 传入，内容区可滚动。
 */
export function Sheet({
  onClose,
  title,
  children,
  maxHeight = "calc(100vh - 48px)",
}: {
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxHeight?: string;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const close = () => {
    setShown(false);
    setTimeout(onClose, 200);
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center">
      <div
        onClick={close}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`relative flex w-full max-w-[430px] flex-col overflow-hidden rounded-t-[20px] bg-card shadow-2xl transition-transform duration-200 ${
          shown ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ maxHeight }}
      >
        {title ? (
          <div className="flex items-center justify-between border-b border-border-soft px-4 py-3">
            <h3 className="text-[14px] font-medium text-ink">{title}</h3>
            <button
              type="button"
              onClick={close}
              aria-label="关闭"
              className="shrink-0 rounded-full p-1 text-ink-4 active:opacity-60"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
          </div>
        ) : null}
        <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div>
      </div>
    </div>
  );
}
