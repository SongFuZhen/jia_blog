import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";

type MoodTone = "pink" | "green" | "orange" | "purple";

const moodClasses: Record<MoodTone, string> = {
  pink: "bg-[#FEF0EE] text-[#D95570]",
  green: "bg-[#E9F3EC] text-[#4E9A6E]",
  orange: "bg-[#FEF4EC] text-[#E07A3F]",
  purple: "bg-[#F2E9FE] text-[#8B5FD6]",
};

const entries = [
  {
    date: "08-30",
    weekday: "周六",
    mood: "开心",
    tone: "pink" as MoodTone,
    title: "今天的妆容超满意",
    excerpt: "新手奶茶妆第一次成功，出门被夸了两回，开心到路上都想跳起来～",
  },
  {
    date: "08-28",
    weekday: "周四",
    mood: "平静",
    tone: "green" as MoodTone,
    title: "下班路上的晚霞",
    excerpt: "天空是橘子汽水的颜色，忽然觉得慢一点的生活也很珍贵。",
  },
  {
    date: "08-26",
    weekday: "周二",
    mood: "元气",
    tone: "orange" as MoodTone,
    title: "早起打卡第一天",
    excerpt: "七点起床做了早餐，一整天都精神满满，希望可以坚持一个月！",
  },
  {
    date: "08-24",
    weekday: "周日",
    mood: "有点emo",
    tone: "purple" as MoodTone,
    title: "莫名低落的一天",
    excerpt: "也不知道为什么，就是有点提不起劲。抱抱自己，早点睡吧。",
  },
  {
    date: "08-21",
    weekday: "周四",
    mood: "开心",
    tone: "pink" as MoodTone,
    title: "和好朋友逛街啦",
    excerpt: "试了好多条裙子，最后买了那条奶白色的，晚上吃了火锅，满足。",
  },
];

export const metadata = { title: "日记 · 小嘉的生活日记" };

export default function DiaryPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <PageHeader title="我的日记" subtitle="把每天的心情都收藏起来" />

      {/* 本月记录摘要 */}
      <div className="mt-5 flex items-center gap-3 rounded-[20px] bg-gradient-to-r from-[#FEEBEE] to-[#FBE5EC] p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#D56983] text-white">
          <Sparkles className="size-5" strokeWidth={1.8} />
        </span>
        <div>
          <p className="text-[14.5px] font-semibold text-[#3B2E2A]">
            8月已记录 12 篇 · 连续记录 5 天
          </p>
          <p className="mt-0.5 text-[12px] text-[#A8928B]">
            坚持记录的你，一直在闪闪发光
          </p>
        </div>
      </div>

      {/* 日记列表 */}
      <div className="mt-5 space-y-3">
        {entries.map((e) => (
          <article
            key={e.title}
            className="flex gap-3.5 rounded-[16px] bg-[#FEFCFB] p-3.5 shadow-[var(--shadow-soft-sm)] transition-shadow hover:shadow-[var(--shadow-soft-md)]"
          >
            {/* 日期块 */}
            <div className="flex w-[44px] shrink-0 flex-col items-center justify-center rounded-[12px] bg-[#FDF3F0] py-2">
              <span className="text-[15px] leading-none font-bold text-[#E0697E]">
                {e.date}
              </span>
              <span className="mt-1 text-[11px] text-[#A8928B]">
                {e.weekday}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h2 className="truncate text-[15px] font-semibold text-[#2E2422]">
                  {e.title}
                </h2>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-[3px] text-[11px] leading-none ${moodClasses[e.tone]}`}
                >
                  {e.mood}
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-[#7A6A63]">
                {e.excerpt}
              </p>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
