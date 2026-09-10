/**
 * 循环任务（习惯）的打卡计算：全部是纯函数，按本地日期 YYYY-MM-DD 计算。
 * 空白天（没打卡的日子）在读取时推导为「没做」，不写回数据库。
 */

import type { CheckStatus, GrowthItem, GrowthSection } from "@/lib/types";

export interface HabitItem extends GrowthItem {
  sectionTitle: string;
}

/** 某一天在圆点条上的样子：unknown=还没开始记，pending=今天还没打卡 */
export type DayState = CheckStatus | "pending" | "unknown";

export interface DayCell {
  date: string;
  state: DayState;
}

function toDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d, 12); // 正午，避开夏令时与跨零点误差
}

function fmt(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 日期加减天数 */
export function addDays(date: string, delta: number): string {
  const d = toDate(date);
  d.setDate(d.getDate() + delta);
  return fmt(d);
}

/** 该日期所在周的周一 */
export function weekStartOf(date: string): string {
  const wd = toDate(date).getDay(); // 0=周日
  return addDays(date, wd === 0 ? -6 : 1 - wd);
}

/** 周一 ~ 周日 */
export function weekRange(weekStart: string): { from: string; to: string } {
  return { from: weekStart, to: addDays(weekStart, 6) };
}

/** "YYYY-MM" 的首末日 */
export function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` };
}

/** 所有循环任务，带上所属分区名 */
export function habitsOf(sections: GrowthSection[]): HabitItem[] {
  return sections.flatMap((s) =>
    s.items.filter((i) => i.repeat).map((i) => ({ ...i, sectionTitle: s.title })),
  );
}

/** 第一次打卡的日子（没有记录时 undefined） */
function firstLogDate(item: GrowthItem): string | undefined {
  const keys = Object.keys(item.log ?? {}).sort();
  return keys[0];
}

/**
 * 有效日志：把「上次打卡之后到昨天」之间的空洞补成没做。
 * 今天永远不补（还没过完），截止日之后也不补（习惯已经结束了）。
 */
export function effectiveLog(
  item: GrowthItem,
  today: string,
): Record<string, CheckStatus> {
  const raw = item.log ?? {};
  const keys = Object.keys(raw).sort();
  if (keys.length === 0) return {};

  let end = addDays(today, -1);
  if (item.due && item.due < end) end = item.due;

  const out: Record<string, CheckStatus> = { ...raw };
  for (let d = keys[0]; d <= end; d = addDays(d, 1)) {
    if (!out[d]) out[d] = "skip";
  }
  return out;
}

/** 当天的打卡状态（未打卡为 undefined） */
export function todayStatus(
  item: GrowthItem,
  today: string,
): CheckStatus | undefined {
  return (item.log ?? {})[today];
}

/** 连续「做了」的天数：今天还没打卡时不算断，从昨天往前数 */
export function currentStreak(item: GrowthItem, today: string): number {
  const log = effectiveLog(item, today);
  let cursor = log[today] ? today : addDays(today, -1);
  let n = 0;
  while (log[cursor] === "done") {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

/** 累计打卡次数 = 历史基线 + 日志记录里「做了」的天数 */
export function totalChecks(item: GrowthItem): number {
  const done = Object.values(item.log ?? {}).filter((v) => v === "done").length;
  return (item.cycleCount ?? 0) + done;
}

/** 从 from 开始的连续 count 天，用于圆点条 */
export function dayList(
  item: GrowthItem,
  from: string,
  count: number,
  today: string,
): DayCell[] {
  const log = effectiveLog(item, today);
  const first = firstLogDate(item);
  const cells: DayCell[] = [];
  for (let i = 0; i < count; i++) {
    const date = addDays(from, i);
    const s = log[date];
    const state: DayState = s
      ? s
      : date > today || (first != null && date < first)
        ? "unknown"
        : "pending";
    cells.push({ date, state });
  }
  return cells;
}

/** 最近 7 天（含今天） */
export function last7Days(item: GrowthItem, today: string): DayCell[] {
  return dayList(item, addDays(today, -6), 7, today);
}

/** 区间内做了/没做各几天；只统计到今天为止，没开始记的日子不算 */
export function summarizeRange(
  item: GrowthItem,
  from: string,
  to: string,
  today: string,
): { done: number; skip: number; total: number; rate: number } {
  const hi = to < today ? to : today;
  const log = effectiveLog(item, today);
  let done = 0;
  let skip = 0;
  for (let d = from; d <= hi; d = addDays(d, 1)) {
    if (log[d] === "done") done++;
    else if (log[d] === "skip") skip++;
  }
  const total = done + skip;
  return { done, skip, total, rate: total ? Math.round((done / total) * 100) : 0 };
}
