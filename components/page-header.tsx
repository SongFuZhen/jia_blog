"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  back = true,
  action,
}: {
  title: string;
  subtitle?: string;
  /** 默认显示返回按钮（首页不用 PageHeader）；传 false 可关闭 */
  back?: boolean;
  /** 标题右侧的操作区，一般放「新增」按钮 */
  action?: ReactNode;
}) {
  const router = useRouter();

  function handleBack() {
    // 无历史记录（直接打开二级页）时回首页兜底
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }

  return (
    <header className="flex items-center gap-3 pt-9">
      {back && (
        <button
          onClick={handleBack}
          aria-label="返回"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-ink-3 dark:bg-[#2B2225] shadow-[var(--shadow-xs)] transition-colors hover:text-[#E0697E]"
        >
          <ArrowLeft className="size-4.5" strokeWidth={1.8} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="text-[22px] font-bold text-ink">{title}</h1>
        {subtitle && (
          <p className="font-display mt-1.5 text-[15px] text-ink-3">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
