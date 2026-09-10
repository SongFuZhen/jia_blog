"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { Check, ChevronRight, ListChecks, Repeat } from "lucide-react";
import { useGrowthStore } from "@/lib/stores/growth";
import { currentStreak, todayStatus } from "@/lib/habit";
import { todayLocal } from "@/lib/time";
import type { GrowthItem } from "@/lib/types";

interface Task extends GrowthItem {
  sectionTitle: string;
  /** 已逾期天数（0=今天到期） */
  overdueDays?: number;
  /** 循环任务距离截止日还剩几天（undefined=非循环任务或没设截止日） */
  daysLeft?: number;
  /** 循环任务已连续打卡天数 */
  streak?: number;
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
  const logCheck = useGrowthStore((s) => s.logCheck);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const today = todayLocal();

  const tasks = useMemo(() => {
    const list: Task[] = [];
    for (const section of sections) {
      for (const item of section.items) {
        if (item.done) continue;
        if (item.repeat) {
          // 循环任务每天都做，截止日只表示「做到哪天为止」，未来截止日不该把它藏起来
          if (todayStatus(item, today)) continue; // 今天已经记过一笔了
          const left = item.due ? daysBetween(today, item.due) : undefined;
          list.push({
            ...item,
            sectionTitle: section.title,
            overdueDays: left != null && left < 0 ? -left : 0,
            daysLeft: left,
            streak: currentStreak(item, today),
          });
        } else if (item.due && item.due <= today) {
          // 一次性任务：今天到期或已逾期才算今日待办
          list.push({
            ...item,
            sectionTitle: section.title,
            overdueDays: daysBetween(item.due, today),
          });
        }
      }
    }
    // 逾期越久排越前
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
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-[16px] bg-card px-3.5 py-3 shadow-[var(--shadow-soft-sm)]"
          >
            <button
              aria-label={t.repeat ? "记一笔做了" : "完成"}
              onClick={() =>
                t.repeat
                  ? logCheck(t.sectionTitle, t.id, today, "done")
                  : toggle(t.sectionTitle, t.id)
              }
              className="flex size-9 shrink-0 items-center justify-center active:opacity-60"
            >
              <span className="flex size-[22px] items-center justify-center rounded-full border border-toggle-off bg-white dark:bg-card">
                {/* 未完成的空心圈：点一下即完成 */}
              </span>
            </button>
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
                {t.streak ? (
                  <span className="text-[#4E9A6E]">连续 {t.streak} 天</span>
                ) : null}
                {t.overdueDays ? (
                  <span className="text-[#E5484D]">逾期 {t.overdueDays} 天</span>
                ) : null}
                {t.daysLeft ? <span>还剩 {t.daysLeft} 天</span> : null}
              </span>
            </span>
            {t.repeat ? (
              <button
                onClick={() => logCheck(t.sectionTitle, t.id, today, "skip")}
                className="shrink-0 rounded-full bg-field px-3 py-2 text-[11.5px] text-ink-3 active:opacity-60"
              >
                没做
              </button>
            ) : (
              <Check className="size-4 shrink-0 text-ink-5" strokeWidth={2} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
