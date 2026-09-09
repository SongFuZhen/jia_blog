/**
 * 重要日子：生日 / 纪念日 / 传统节日 的统一定义与计算。
 * - 用户数据存 DB（important-days 集合），见 lib/stores/important-days.ts
 * - 传统节日为内置静态列表（农历），自动换算阳历
 * - 支持「农历日期不存在则顺延」：如农历七月三十在部分年份不存在，自动落到八月初一
 */
import { lunarToSolar, solarToLunarLabel, jieqiToSolar } from "@/lib/lunar";

export type ImportantDayKind = "festival" | "birthday" | "anniversary" | "custom";

export interface ImportantDay {
  id: string;
  name: string;
  kind: ImportantDayKind;
  /** 日期是否按农历记录 */
  isLunar: boolean;
  /** 月份 1-12（农历/阳历同义） */
  month: number;
  /** 农历日 1-30 */
  day: number;
  emoji?: string;
  note?: string;
  /** 按节气计算的节日（如「清明」），有值时忽略 month/day */
  jieqi?: string;
}

export interface UpcomingEvent {
  id: string;
  name: string;
  kind: ImportantDayKind;
  /** 阳历日期 YYYY-MM-DD */
  date: string;
  /** 农历标签，如「农历八月初一」；阳历节日为空 */
  lunar: string;
  emoji: string;
  /** 距离今天还有几天（0=今天） */
  daysUntil: number;
  isLunar: boolean;
}

/** 内置节日：农历传统节日 + 节气 + 公历节假日（不含政治类节日）。 */
export const TRADITIONAL_FESTIVALS: Omit<ImportantDay, "id">[] = [
  // —— 农历传统节日 ——
  { name: "春节", kind: "festival", isLunar: true, month: 1, day: 1, emoji: "🧧" },
  { name: "元宵", kind: "festival", isLunar: true, month: 1, day: 15, emoji: "🏮" },
  { name: "龙抬头", kind: "festival", isLunar: true, month: 2, day: 2, emoji: "🐉" },
  { name: "端午", kind: "festival", isLunar: true, month: 5, day: 5, emoji: "🍙" },
  { name: "七夕", kind: "festival", isLunar: true, month: 7, day: 7, emoji: "💕" },
  { name: "中元", kind: "festival", isLunar: true, month: 7, day: 15, emoji: "🪔" },
  { name: "中秋", kind: "festival", isLunar: true, month: 8, day: 15, emoji: "🌕" },
  { name: "重阳", kind: "festival", isLunar: true, month: 9, day: 9, emoji: "🌼" },
  { name: "腊八", kind: "festival", isLunar: true, month: 12, day: 8, emoji: "🥣" },
  { name: "小年", kind: "festival", isLunar: true, month: 12, day: 23, emoji: "🧨" },
  // 除夕：腊月三十，该年只有廿九时自动落到廿九
  { name: "除夕", kind: "festival", isLunar: true, month: 12, day: 30, emoji: "🧧" },

  // —— 节气（每年阳历日期浮动，用节气表精算）——
  { name: "清明", kind: "festival", isLunar: false, month: 4, day: 5, jieqi: "清明", emoji: "🎋" },
  { name: "冬至", kind: "festival", isLunar: false, month: 12, day: 21, jieqi: "冬至", emoji: "🥟" },

  // —— 公历节假日 / 生活向节日 ——
  { name: "元旦", kind: "festival", isLunar: false, month: 1, day: 1, emoji: "🎊" },
  { name: "妇女节", kind: "festival", isLunar: false, month: 3, day: 8, emoji: "💐" },
  { name: "劳动节", kind: "festival", isLunar: false, month: 5, day: 1, emoji: "🧳" },
  { name: "儿童节", kind: "festival", isLunar: false, month: 6, day: 1, emoji: "🧸" },
  { name: "教师节", kind: "festival", isLunar: false, month: 9, day: 10, emoji: "🍎" },
  { name: "国庆节", kind: "festival", isLunar: false, month: 10, day: 1, emoji: "🎈" },
  { name: "万圣节", kind: "festival", isLunar: false, month: 10, day: 31, emoji: "🎃" },
  { name: "平安夜", kind: "festival", isLunar: false, month: 12, day: 24, emoji: "🍎" },
  { name: "圣诞节", kind: "festival", isLunar: false, month: 12, day: 25, emoji: "🎄" },
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`;
}

function startOfToday(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * 单个重要日子在本年/明年对应的阳历日期。
 * 农历自动换算；若该农历日不存在（如七月三十），且日是 30，则顺延到下一月初一。
 */
/**
 * 单个日子在某一年对应的阳历日期。
 * 节气优先（清明等）；其次农历换算；农历三十不存在时先退回廿九（如除夕），
 * 再不行才顺延到下一月初一。
 */
function solarOf(day: Omit<ImportantDay, "id">, year: number) {
  if (day.jieqi) return jieqiToSolar(year, day.jieqi);
  if (!day.isLunar) return { year, month: day.month, day: day.day };
  return (
    lunarToSolar(year, day.month, day.day) ??
    (day.day === 30
      ? (lunarToSolar(year, day.month, 29) ??
        lunarToSolar(year, day.month + 1, 1))
      : null)
  );
}

function occurrences(day: Omit<ImportantDay, "id">, fromYear: number): Date[] {
  const out: Date[] = [];
  for (const y of [fromYear, fromYear + 1]) {
    const s = solarOf(day, y);
    if (s) out.push(new Date(s.year, s.month - 1, s.day));
  }
  return out;
}

/**
 * 取未来 windowDays 天内的即将到来日子（含今天）。
 * 传统节日与用户重要日子合并后按日期升序。
 */
function buildEvents(
  all: ImportantDay[],
  windowDays: number,
  now: Date,
): UpcomingEvent[] {
  const today = startOfToday(now);
  const end = new Date(today);
  end.setDate(end.getDate() + windowDays);

  const events: UpcomingEvent[] = [];
  const seen = new Set<string>();

  for (const d of all) {
    for (const occ of occurrences(d, today.getFullYear())) {
      if (occ < today || occ > end) continue;
      const dateStr = toDateStr(occ.getFullYear(), occ.getMonth() + 1, occ.getDate());
      const key = `${d.id}|${dateStr}`;
      if (seen.has(key)) continue;
      seen.add(key);
      events.push({
        id: d.id,
        name: d.name,
        kind: d.kind,
        date: dateStr,
        lunar: d.isLunar ? solarToLunarLabel(occ) : "",
        emoji: d.emoji ?? "📅",
        daysUntil: Math.round((occ.getTime() - today.getTime()) / 86400000),
        isLunar: d.isLunar,
      });
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

/** 核对结果：error=算不出日期，warn=重复或不出现 */
export interface DayIssue {
  level: "error" | "warn";
  /** 命中的日子 id（可定位去编辑） */
  ids: string[];
  message: string;
}

/**
 * 核对重要日子：日期算不算得出来、未来一年会不会出现、有没有重复录入。
 * 页面上一个按钮触发，结果直接列出来给人看。
 */
export function auditImportantDays(
  userDays: ImportantDay[],
  now = new Date(),
): DayIssue[] {
  const issues: DayIssue[] = [];
  const y = now.getFullYear();

  // 1. 日期本身算不出来（农历当年无此日 / 公历日期不存在，如 2 月 30 日）
  for (const d of userDays) {
    if (solarOf(d, y) || solarOf(d, y + 1)) continue;
    issues.push({
      level: "error",
      ids: [d.id],
      message: `「${d.name}」的日期算不出来（${
        d.isLunar ? `农历 ${d.month} 月 ${d.day} 日` : `${d.month} 月 ${d.day} 日`
      }），${y}、${y + 1} 年都没有这一天`,
    });
  }

  // 2. 未来一年不会出现（日期已过或落在窗口外）
  const upcoming = new Set(getUserUpcoming(userDays, 370, now).map((e) => e.id));
  for (const d of userDays) {
    if (upcoming.has(d.id)) continue;
    if (issues.some((i) => i.level === "error" && i.ids.includes(d.id))) continue;
    issues.push({
      level: "warn",
      ids: [d.id],
      message: `「${d.name}」未来一年不会出现，检查一下日期是不是填错了`,
    });
  }

  // 3. 完全重复：名称 + 农历/公历 + 月日都一样
  const groups = new Map<string, ImportantDay[]>();
  for (const d of userDays) {
    const key = `${d.name.trim()}|${d.isLunar ? "L" : "S"}|${d.month}|${d.day}|${d.jieqi ?? ""}`;
    groups.set(key, [...(groups.get(key) ?? []), d]);
  }
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    issues.push({
      level: "warn",
      ids: list.map((d) => d.id),
      message: `「${list[0].name}」重复了 ${list.length} 条，建议只留一条`,
    });
  }

  return issues;
}

/** 内置传统节日 + 用户重要日子，取未来 windowDays 天内 */
export function getUpcoming(
  userDays: ImportantDay[],
  windowDays = 30,
  now = new Date(),
): UpcomingEvent[] {
  const all = [
    ...TRADITIONAL_FESTIVALS.map((f, i) => ({ ...f, id: `festival-${i}` })),
    ...userDays,
  ];
  return buildEvents(all, windowDays, now);
}

/** 只看用户自己的重要日子（不含内置传统节日），默认覆盖未来一年 */
export function getUserUpcoming(
  userDays: ImportantDay[],
  windowDays = 370,
  now = new Date(),
): UpcomingEvent[] {
  const events = buildEvents(userDays, windowDays, now);
  // 同一天最多出现一次：跨年窗口可能同时含今年与明年，只保留最近的一次
  const seen = new Set<string>();
  return events.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

/** 内置节日（不含用户自定义），默认覆盖未来一年 */
export function getFestivalUpcoming(
  windowDays = 370,
  now = new Date(),
): UpcomingEvent[] {
  const all = TRADITIONAL_FESTIVALS.map((f, i) => ({ ...f, id: `festival-${i}` }));
  const events = buildEvents(all, windowDays, now);
  const seen = new Set<string>();
  return events.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

/** YYYY-MM-DD → 周几（按本地时区构造，避免 UTC 偏移算错一天） */
export function weekdayLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][
    new Date(y, m - 1, d).getDay()
  ];
}

/**
 * 把一个重要日子换算成某一年的阳历 monthDay（MM-DD），用于首页惊喜匹配。
 * 农历自动换算；农历三十不存在时先退回廿九，再顺延到下一月初一。
 */
export function toSolarMonthDay(
  day: Omit<ImportantDay, "id">,
  year: number,
): { monthDay: string; label: string } | null {
  const s = solarOf(day, year);
  if (!s) return null;
  return { monthDay: toDateStr(s.year, s.month, s.day).slice(5), label: day.name };
}
