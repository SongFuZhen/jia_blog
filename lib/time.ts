/**
 * 本地时间工具：记录类时间戳统一用「本地时区」，避免 UTC 在跨零点时差下
 * 把日期算错一天（例如中国 UTC+8 凌晨创建的记录被记到前一天）。
 */

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

/** 形如 2026-09-10T14:03:21.123 的本地时间戳（无 Z，按本地时区） */
export function nowLocalISO(): string {
  const d = new Date();
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
  );
}

/** 本地日期 YYYY-MM-DD */
export function todayLocal(): string {
  return nowLocalISO().slice(0, 10);
}
