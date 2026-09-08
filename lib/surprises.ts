/**
 * 界面文案库：默认值 + 纯函数。
 * 实际数据存 DB（copy-library 集合），可在 /copy 文案编辑页修改；
 * 本文件的 DEFAULT_COPY_LIBRARY 只作为首次使用/加载前的兜底。
 * 统一按东八区（Asia/Shanghai）取日期，服务端与客户端结果一致，避免水合不一致。
 */
import type { CopyLibrary, GreetingDay } from "@/lib/types";

export const DEFAULT_COPY_LIBRARY: CopyLibrary = {
  greetings: [
    {
      label: "周日",
      texts: ["休息日也要好好爱自己呀", "今天的任务：吃好喝好，心情变好", "晒晒太阳，给自己充充电吧"],
    },
    {
      label: "周一",
      texts: ["新的一周，慢慢来", "周一也要元气满满地出发呀", "新的一周，会有新的小美好在等你"],
    },
    {
      label: "周二",
      texts: ["今天也要元气满满哦", "再小的进步，也值得为自己鼓掌", "把今天过成自己喜欢的样子"],
    },
    {
      label: "周三",
      texts: ["过半啦，坚持住～", "一周过半啦，周末正在向你招手", "今天也要闪闪发光哦"],
    },
    {
      label: "周四",
      texts: ["再坚持一下就到周末啦", "快啦快啦，周末就在前面等你", "今天的努力，都是在给周末的快乐铺路"],
    },
    {
      label: "周五",
      texts: ["今天可以奖励自己一下", "熬过今天就是周末，冲呀", "周五的快乐，谁都无法阻挡"],
    },
    {
      label: "周六",
      texts: ["周末快乐，去做喜欢的事吧", "睡到自然醒，就是最好的礼物", "今天不赶时间，慢慢来就好"],
    },
  ],
  anniversaries: [
    { monthDay: "10-07", label: "在一起纪念日" },
    { monthDay: "02-14", label: "情人节" },
    { monthDay: "05-20", label: "520" },
  ],
  surprises: [
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
  ],
};

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

/** 今天的问候语：texts[0] 是星期名 */
export function getGreeting(library: CopyLibrary, now = new Date()) {
  const cn = cnNow(now);
  const day: GreetingDay | undefined = library.greetings[cn.weekday];
  const label = day?.label ?? greetingsFallbackLabel(cn.weekday);
  const pool = day?.texts?.length ? day.texts : ["今天也要好好生活呀"];
  return {
    label,
    text: pickByDate(pool, `${cn.year}-${cn.month}-${cn.day}`),
  };
}

function greetingsFallbackLabel(weekday: number): string {
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][weekday];
}

/** 今日小惊喜：纪念日优先，否则从文案库挑一条 */
export function getSurprise(library: CopyLibrary, now = new Date()) {
  const cn = cnNow(now);
  const hit = library.anniversaries.find((a) => a.monthDay === cn.monthDay);
  if (hit)
    return { text: `今天是我们的${hit.label}，纪念一下呀 ♡`, isAnniversary: true };
  const pool = library.surprises.length
    ? library.surprises
    : DEFAULT_COPY_LIBRARY.surprises;
  return {
    text: pickByDate(pool, `${cn.year}-${cn.month}-${cn.day}`),
    isAnniversary: false,
  };
}
