"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { Check, ChevronRight, ListChecks, Repeat } from "lucide-react";
import { useGrowthStore } from "@/lib/stores/growth";
import { todayLocal } from "@/lib/time";
import type { GrowthItem } from "@/lib/types";

interface Task extends GrowthItem {
  sectionTitle: string;
  /** 已逾期天数（0=今天到期，undefined=无截止日） */
  overdueDays?: number;
}

function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  return Math.round((b - a) / 86400000);
}

/** 首页「今日待办」：循环任务 + 今天到期/已逾期的小事，点圆圈即可完成 */
export function TodayTasks() {
  const sections = useGrowthStore((s) => s.sections);
  const hydrated = useGrowthStore((s) => s.hydrated);
  const hydrate = useGrowthStore((s) => s.hydrate);
  const toggle = useGrowthStore((s) => s.toggle);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const today = todayLocal();

  const tasks = useMemo(() => {
    const list: Task[] = [];
    for (const section of sections) {
      for (const item of section.items) {
        if (item.done) continue;
        if (item.due) {
          if (item.due > today) continue; // 还没到日子
          list.push({
            ...item,
            sectionTitle: section.title,
            overdueDays: daysBetween(item.due, today),
          });
        } else if (item.repeat) {
          // 循环任务没有截止日，也算今天的待办
          list.push({ ...item, sectionTitle: section.title });
        }
      }
    }
    // 逾期的排前面，其次今天到期，最后循环任务
    return list
      .sort((a, b) => (b.overdueDays ?? -1) - (a.overdueDays ?? -1))
      .slice(0, 5);
  }, [sections, today]);

  if (!hydrated || tasks.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="flex items-center gap-1.5 text-[12px] font-medium text-ink-4">
          <ListChecks className="size-3.5" strokeWidth={1.8} />
          今日待办
        </p>
        <Link
          href="/growth"
          className="flex items-center gap-0.5 text-[11.5px] text-ink-4 active:opacity-60"
        >
          全部
          <ChevronRight className="size-3" strokeWidth={2} />
        </Link>
      </div>
      <div className="space-y-2">
        {tasks.map((t) => (
          <button
            key={t.id}
            onClick={() => toggle(t.sectionTitle, t.id)}
            className="flex w-full items-center gap-3 rounded-[16px] bg-card px-3.5 py-3 text-left shadow-[var(--shadow-soft-sm)] active:opacity-60"
          >
            <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full border border-toggle-off bg-white dark:bg-card">
              {/* 未完成的空心圈：点一下即完成 */}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-[14px] font-medium text-ink">
                  {t.text}
                </span>
                {t.repeat && (
                  <Repeat className="size-3.5 shrink-0 text-[#E08AA0]" strokeWidth={2} />
                )}
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-4">
                {t.sectionTitle}
                {t.overdueDays != null && t.overdueDays > 0 && (
                  <span className="text-[#E5484D]">逾期 {t.overdueDays} 天</span>
                )}
              </span>
            </span>
            <Check className="size-4 shrink-0 text-ink-5" strokeWidth={2} />
          </button>
        ))}
      </div>
    </div>
  );
}
