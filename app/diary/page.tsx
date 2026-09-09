"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Loading } from "@/components/loading";
import { useRecordsStore } from "@/lib/stores/records";
import { UpcomingDaysCard } from "@/components/upcoming-days-card";
import type { LifeRecord, Mood } from "@/lib/types";

type MoodTone = "pink" | "green" | "orange" | "purple";

const moodTones: Record<Mood, MoodTone> = {
  开心: "pink",
  幸福: "pink",
  平静: "green",
  委屈: "purple",
  难过: "purple",
  生气: "orange",
  好困: "orange",
  有成就感: "green",
};

const moodClasses: Record<MoodTone, string> = {
  pink: "bg-pink-soft text-pink-ink",
  green: "bg-green-soft text-green-ink",
  orange: "bg-orange-soft text-orange-ink",
  purple: "bg-purple-soft text-purple-ink",
};

const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const allMoods: (Mood | "全部")[] = [
  "全部",
  "开心",
  "幸福",
  "平静",
  "委屈",
  "难过",
  "生气",
  "好困",
  "有成就感",
];

const monthNames = [
  "一月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "十一月",
  "十二月",
];

/** 连续记录天数：从最近一条往前数连续的自然日 */
/** 中文年份信息：干支（如乙巳）、生肖（如蛇） */
const TIAN_GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const DI_ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const ZODIAC = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];

function yearInfo(year: number): { zodiac: string; ganzhi: string } {
  const stem = TIAN_GAN[(((year - 4) % 10) + 10) % 10];
  const branchIdx = (((year - 4) % 12) + 12) % 12;
  const branch = DI_ZHI[branchIdx];
  return {
    zodiac: `${ZODIAC[branchIdx]}年`,
    ganzhi: `${stem}${branch}年`,
  };
}

function fmtLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  const cursor = new Date(`${dates[0]}T00:00:00`);
  const today = new Date();
  const diffDays = Math.floor(
    (today.setHours(0, 0, 0, 0) - cursor.getTime()) / 86400000,
  );
  if (diffDays > 1) return 0;
  let streak = 0;
  while (set.has(fmtLocalDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function DiaryPage() {
  const records = useRecordsStore((s) => s.records);
  const hydrated = useRecordsStore((s) => s.hydrated);
  const hydrate = useRecordsStore((s) => s.hydrate);
  const [moodFilter, setMoodFilter] = useState<Mood | "全部">("全部");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const filtered = useMemo(
    () =>
      records.filter(
        (r) =>
          !r.draft &&
          (moodFilter === "全部" || r.mood === moodFilter),
      ),
    [records, moodFilter],
  );

  // 按月分组（records 已按 createdAt 倒序）
  const groups = useMemo(() => {
    const map = new Map<string, LifeRecord[]>();
    for (const r of filtered) {
      const key = r.createdAt.slice(0, 7);
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthCount = records.filter(
    (r) => !r.draft && r.createdAt.startsWith(monthPrefix),
  ).length;
  const streak = calcStreak(
    records
      .filter((r) => !r.draft)
      .map((r) => r.createdAt.slice(0, 10))
      .sort()
      .reverse(),
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <PageHeader title="我的日记" subtitle="把每天的心情都收藏起来" />

      {/* 本月记录摘要 */}
      <div className="mt-5 flex items-center gap-3 rounded-[20px] bg-gradient-to-r from-pink-soft to-pink-soft-2 p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#D56983] text-white">
          <Sparkles className="size-5" strokeWidth={1.8} />
        </span>
        <div>
          <p className="text-[14.5px] font-semibold text-ink">
            {now.getMonth() + 1}月已记录 {monthCount} 篇 · 连续记录 {streak} 天
          </p>
          <p className="mt-0.5 text-[12px] text-ink-4">
            坚持记录的你，一直在闪闪发光
          </p>
        </div>
      </div>

      {/* 未来一个月的重要日子（传统节日 + 生日 + 纪念日） */}
      <div className="mt-3">
        <UpcomingDaysCard />
      </div>

      {/* 心情筛选 */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {allMoods.map((m) => (
          <button
            key={m}
            onClick={() => setMoodFilter(m)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
              moodFilter === m
                ? "bg-[#F16D88] text-white"
                : "bg-white text-ink-3 dark:bg-[#2B2225] shadow-[var(--shadow-xs)] hover:text-[#F16D88]"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* 分组列表 */}
      {groups.length === 0 ? (
        !hydrated ? (
          <Loading />
        ) : (
          <p className="mt-10 text-center text-[13px] text-ink-4">
            {moodFilter === "全部" ? "还没有记录，点下面的 ＋ 写下第一条吧" : "这个心情下还没有记录"}
          </p>
        )
      ) : (
        groups.map(([month, list]) => {
          const year = month.slice(0, 4);
          const monthLabel = monthNames[Number(month.slice(5, 7)) - 1];
          const yInfo = yearInfo(Number(year));
          return (
          <section key={month} className="mt-5">
            <h2 className="flex flex-wrap items-baseline gap-x-2 px-1 text-[13px] font-semibold text-ink-3">
              <span>{monthLabel}</span>
              <span className="text-[12px] font-normal text-ink-4">
                {year}年 · {yInfo.ganzhi} · {yInfo.zodiac}
              </span>
            </h2>
            <div className="mt-2.5 space-y-3">
              {list.map((e) => {
                const d = new Date(`${e.createdAt.slice(0, 10)}T00:00:00`);
                return (
                  <Link
                    key={e.id}
                    href={`/record/${e.id}`}
                    className="flex gap-3.5 rounded-[16px] bg-card p-3.5 shadow-[var(--shadow-soft-sm)] transition-shadow hover:shadow-[var(--shadow-soft-md)]"
                  >
                    <div className="flex w-[44px] shrink-0 flex-col items-center justify-center rounded-[12px] bg-pink-soft py-2">
                      <span className="text-[15px] leading-none font-bold text-[#E0697E]">
                        {e.createdAt.slice(8, 10)}
                      </span>
                      <span className="mt-1 text-[11px] text-ink-4">
                        {weekdays[d.getDay()]}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate text-[15px] font-semibold text-ink">
                          {e.title}
                        </h3>
                        {e.mood && (
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-[3px] text-[11px] leading-none ${moodClasses[moodTones[e.mood]]}`}
                          >
                            {e.mood}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-ink-2">
                        {e.content}
                      </p>
                    </div>
                    {e.images?.[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={e.images[0]}
                        alt=""
                        className="size-[44px] shrink-0 self-center rounded-[12px] object-cover"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
          );
        })
      )}
    </main>
  );
}
