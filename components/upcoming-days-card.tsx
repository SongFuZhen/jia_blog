"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useImportantDaysStore } from "@/lib/stores/important-days";
import { getUpcoming, weekdayLabel } from "@/lib/important-days";

/** 倒计时配色：越近越醒目 */
function daysTone(days: number) {
  if (days === 0)
    return { bg: "bg-[#E96882]", text: "text-white", label: "今天" };
  if (days <= 3)
    return { bg: "bg-[#FBE0D2]", text: "text-[#C4602A]", label: `${days}天` };
  if (days <= 7)
    return { bg: "bg-[#FBEFCF]", text: "text-[#A9721C]", label: `${days}天` };
  if (days <= 15)
    return { bg: "bg-[#EAF3E8]", text: "text-[#4E8A5B]", label: `${days}天` };
  return { bg: "bg-white/70", text: "text-ink-4", label: `${days}天` };
}

/** 未来一个月的重要日子（传统节日 + 生日 + 纪念日），首页与日记页共用 */
export function UpcomingDaysCard({ moreHref }: { moreHref?: string }) {
  const days = useImportantDaysStore((s) => s.days);
  const hydrate = useImportantDaysStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const events = useMemo(() => getUpcoming(days, 30), [days]);
  if (events.length === 0) return null;

  return (
    <div className="rounded-[20px] bg-[#FFF7EC] p-4 shadow-[var(--shadow-soft-sm)]">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#B5791F]">
          <span className="size-1.5 rounded-full bg-[#E9A23B]" />
          未来一个月 · 重要日子
        </p>
        {moreHref && (
          <Link
            href={moreHref}
            className="flex items-center gap-0.5 text-[11.5px] text-[#B5791F] active:opacity-60"
          >
            全部
            <ChevronRight className="size-3" strokeWidth={2} />
          </Link>
        )}
      </div>
      <div className="mt-2 space-y-0.5">
        {events.map((e) => {
          const tone = daysTone(e.daysUntil);
          // 主次分明：只有「今天」占两行，其余一行带过
          if (e.daysUntil === 0) {
            return (
              <div
                key={`${e.id}-${e.date}`}
                className="flex items-center gap-2.5 rounded-[14px] bg-[#FDE7EC] px-2 py-2"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E96882]/15 text-[17px]">
                  {e.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-ink">
                    {e.name}
                  </p>
                  <p className="mt-[1px] truncate text-[11px] text-ink-4">
                    {e.date.slice(5)} {weekdayLabel(e.date)}
                    {e.lunar ? ` · ${e.lunar}` : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone.bg} ${tone.text}`}
                >
                  {tone.label}
                </span>
              </div>
            );
          }
          return (
            <div
              key={`${e.id}-${e.date}`}
              className="flex items-center gap-2 rounded-[12px] px-2 py-1.5"
            >
              <span className="shrink-0 text-[14px]">{e.emoji}</span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">
                {e.name}
              </span>
              <span className="shrink-0 text-[11px] text-ink-4">
                {e.date.slice(5)} {weekdayLabel(e.date)}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-[2px] text-[10.5px] font-semibold ${tone.bg} ${tone.text}`}
              >
                {tone.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
