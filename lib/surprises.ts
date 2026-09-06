/**
 * 首页问候语与「今日小惊喜」文案库。
 * 统一按东八区（Asia/Shanghai）取日期，服务端与客户端结果完全一致，
 * 避免水合不一致；同一天固定显示同一条。
 * 想改文案直接编辑下面的数组即可。
 */

export const greetingsByWeekday: string[][] = [
  ["周日", "休息日也要好好爱自己呀"], // 周日
  ["周一", "新的一周，慢慢来"],
  ["周二", "今天也要元气满满哦"],
  ["周三", "过半啦，坚持住～"],
  ["周四", "再坚持一下就到周末啦"],
  ["周五", "今天可以奖励自己一下"],
  ["周六", "周末快乐，去做喜欢的事吧"], // 周六
];

/** 情侣纪念日（月-日）：命中日期时优先展示 */
export const anniversaries = [
  { monthDay: "10-07", label: "在一起纪念日" },
  { monthDay: "02-14", label: "情人节" },
  { monthDay: "05-20", label: "520" },
];

/** 今日小惊喜文案库（夸夸 / 悄悄话） */
export const surprises = [
  "你知道吗，你今天也很好看。",
  "谢谢你愿意把日子记下来，我都看在眼里。",
  "今天也有小小的进步哦，我很骄傲。",
  "不管今天过得怎么样，你都已经很棒了。",
  "悄悄说一句：有你真好。",
  "累的时候要记得休息，我会一直在。",
  "你认真生活的样子，真的很迷人。",
  "记得多喝热水，少生气，多笑一笑。",
  "今天也要像小猫一样，无忧无虑地开心。",
  "你值得世界上所有温柔的事情。",
  "每一条记录里的你，都在慢慢发光。",
  "今晚早点睡，明天会是很好的一天。",
];

/** 当前东八区日期信息（跨时区稳定，服务端/客户端一致） */
export function cnNow(now = new Date()) {
  const fmt = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value]),
  );
  const weekdayMap: Record<string, number> = {
    日: 0,
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
  };
  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    weekday: weekdayMap[parts.weekday.replace("周", "")] ?? 0,
    monthDay: `${parts.month}-${parts.day}`,
  };
}

/** 简单字符串哈希 → 稳定正整数 */
function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function pickByDate<T>(list: T[], key: string): T {
  return list[hashString(key) % list.length];
}

/** 今天的问候语 */
export function getGreeting(now = new Date()) {
  const cn = cnNow(now);
  const list = greetingsByWeekday[cn.weekday];
  const picks = list.slice(1);
  return {
    label: list[0],
    text: pickByDate(picks, `${cn.year}-${cn.month}-${cn.day}`),
  };
}

/** 今日小惊喜：纪念日优先，否则从文案库挑一条 */
export function getSurprise(now = new Date()) {
  const cn = cnNow(now);
  const hit = anniversaries.find((a) => a.monthDay === cn.monthDay);
  if (hit)
    return { text: `今天是我们的${hit.label}，纪念一下呀 ♡`, isAnniversary: true };
  return {
    text: pickByDate(surprises, `${cn.year}-${cn.month}-${cn.day}`),
    isAnniversary: false,
  };
}
