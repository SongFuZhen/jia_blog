/**
 * 农历 ↔ 阳历 换算封装（依赖 lunar-typescript）。
 * 集中在这里，方便日后替换实现或做单测。
 */
import { Lunar, Solar } from "lunar-typescript";

export interface SolarYmd {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

/**
 * 农历转阳历。
 * 若当年该农历日不存在（如农历七月三十在部分年份没有），返回 null。
 */
export function lunarToSolar(
  year: number,
  month: number,
  day: number,
): SolarYmd | null {
  try {
    const l = Lunar.fromYmd(year, month, day);
    const s = l.getSolar();
    // 回环校验：避免越界或闰月错位导致拿到错误日期
    const back = Solar.fromYmd(s.getYear(), s.getMonth(), s.getDay()).getLunar();
    if (
      back.getYear() === year &&
      back.getMonth() === month &&
      back.getDay() === day
    ) {
      return { year: s.getYear(), month: s.getMonth(), day: s.getDay() };
    }
  } catch {
    // 该农历日当年不存在
  }
  return null;
}

/** 节气 → 阳历（如「清明」每年在 4/4-4/6 浮动，用节气表精确换算） */
export function jieqiToSolar(year: number, name: string): SolarYmd | null {
  try {
    const table = Lunar.fromYmd(year, 6, 1).getJieQiTable();
    const s = table[name];
    if (!s) return null;
    return { year: s.getYear(), month: s.getMonth(), day: s.getDay() };
  } catch {
    return null;
  }
}

/** 阳历日期 → 农历中文标签，如「农历八月初一」 */
export function solarToLunarLabel(date: Date): string {
  const s = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const l = s.getLunar();
  return `农历${l.getMonthInChinese()}${l.getDayInChinese()}`;
}
