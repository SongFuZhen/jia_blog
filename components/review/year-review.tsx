"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRecordsStore } from "@/lib/stores/records";
import { useInspirationStore } from "@/lib/stores/inspiration";
import { useBeautyStore } from "@/lib/stores/beauty";
import { useSettingsStore } from "@/lib/stores/settings";
import type { Mood } from "@/lib/types";

const monthNames = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

/** 全年最长连续记录天数 */
function longestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  let best = 0;
  for (const date of set) {
    // 只从每段连续区间的起点开始数（前一天也存在则跳过）
    const prev = new Date(`${date}T00:00:00`);
    prev.setDate(prev.getDate() - 1);
    const y = prev.getFullYear();
    const m = String(prev.getMonth() + 1).padStart(2, "0");
    const d = String(prev.getDate()).padStart(2, "0");
    if (set.has(`${y}-${m}-${d}`)) continue;

    const cursor = new Date(`${date}T00:00:00`);
    let len = 0;
    while (true) {
      const cy = cursor.getFullYear();
      const cm = String(cursor.getMonth() + 1).padStart(2, "0");
      const cd = String(cursor.getDate()).padStart(2, "0");
      if (!set.has(`${cy}-${cm}-${cd}`)) break;
      len += 1;
      cursor.setDate(cursor.getDate() + 1);
    }
    best = Math.max(best, len);
  }
  return best;
}

export function YearReview() {
  const { records, hydrate } = useRecordsStore();
  const { items: inspirations, hydrate: hydrateInsp } = useInspirationStore();
  const { tips, hydrate: hydrateBeauty } = useBeautyStore();
  const { settings, hydrate: hydrateSettings } = useSettingsStore();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => {
    hydrate();
    hydrateInsp();
    hydrateBeauty();
    hydrateSettings();
  }, [hydrate, hydrateInsp, hydrateBeauty, hydrateSettings]);

  const yearPrefix = String(year);

  const yearRecords = useMemo(
    () => records.filter((r) => !r.draft && r.createdAt.startsWith(yearPrefix)),
    [records, yearPrefix],
  );
  const yearInspirations = inspirations.filter((i) =>
    i.createdAt.startsWith(yearPrefix),
  );
  const triedTips = tips.filter((t) => t.triedAt?.startsWith(yearPrefix));
  const photoCount = yearRecords.reduce((n, r) => n + r.images.length, 0);

  /** 逐月聚合 */
  const months = useMemo(() => {
    return monthNames.map((name, idx) => {
      const mm = String(idx + 1).padStart(2, "0");
      const list = yearRecords.filter((r) => r.createdAt.slice(5, 7) === mm);
      const moodMap = new Map<Mood, number>();
      for (const r of list) {
        if (r.mood) moodMap.set(r.mood, (moodMap.get(r.mood) ?? 0) + 1);
      }
      const topMood = [...moodMap.entries()].sort((a, b) => b[1] - a[1])[0];
      return {
        name,
        count: list.length,
        photo: list.find((r) => r.images[0])?.images[0],
        topMood,
        inspCount: yearInspirations.filter((i) => i.createdAt.slice(5, 7) === mm).length,
      };
    });
  }, [yearRecords, yearInspirations]);

  const moodCount = useMemo(() => {
    const map = new Map<Mood, number>();
    for (const r of yearRecords) {
      if (r.mood) map.set(r.mood, (map.get(r.mood) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [yearRecords]);

  const topTags = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of yearRecords) {
      for (const t of r.tags) map.set(t, (map.get(t) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [yearRecords]);

  const streak = useMemo(
    () =>
      longestStreak(yearRecords.map((r) => r.createdAt.slice(0, 10))),
    [yearRecords],
  );

  const photos = yearRecords.flatMap((r) => r.images).slice(0, 8);
  const hasData =
    yearRecords.length > 0 || yearInspirations.length > 0 || triedTips.length > 0;

  return (
    <div className="mt-4">
      {/* 年份切换 */}
      <div className="flex items-center justify-between rounded-full bg-white dark:bg-[#2B2225] px-2 py-1.5 shadow-[var(--shadow-xs)]">
        <button
          onClick={() => setYear((y) => y - 1)}
          aria-label="上一年"
          className="flex size-8 items-center justify-center rounded-full text-ink-3 hover:bg-card-hover hover:text-[#E0697E]"
        >
          <ArrowLeft className="size-4" strokeWidth={1.8} />
        </button>
        <p className="text-[14.5px] font-bold text-ink">{year} 年</p>
        <button
          onClick={() => setYear((y) => y + 1)}
          disabled={year >= now.getFullYear()}
          aria-label="下一年"
          className="flex size-8 items-center justify-center rounded-full text-ink-3 hover:bg-card-hover hover:text-[#E0697E] disabled:opacity-30"
        >
          <ArrowRight className="size-4" strokeWidth={1.8} />
        </button>
      </div>

      {/* 年度小报 */}
      <div className="mt-4 rounded-[20px] bg-card p-5 shadow-[var(--shadow-soft-sm)]">
        <p className="font-display text-center text-[18px] font-bold text-pink-ink">
          {settings.nickname}的 {year} 年
        </p>
        <div className="mx-auto mt-2 h-px w-16 bg-[#F5B8C4]" />

        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <div className="rounded-[14px] bg-card-warm py-3">
            <p className="text-[19px] font-bold text-[#E0697E]">{yearRecords.length}</p>
            <p className="mt-0.5 text-[10.5px] text-ink-4">条记录</p>
          </div>
          <div className="rounded-[14px] bg-card-warm py-3">
            <p className="text-[19px] font-bold text-orange-ink">{photoCount}</p>
            <p className="mt-0.5 text-[10.5px] text-ink-4">张照片</p>
          </div>
          <div className="rounded-[14px] bg-card-warm py-3">
            <p className="text-[19px] font-bold text-purple-ink">{yearInspirations.length}</p>
            <p className="mt-0.5 text-[10.5px] text-ink-4">个灵感</p>
          </div>
          <div className="rounded-[14px] bg-card-warm py-3">
            <p className="text-[19px] font-bold text-green-ink">{triedTips.length}</p>
            <p className="mt-0.5 text-[10.5px] text-ink-4">次尝试</p>
          </div>
        </div>

        {/* 年度之最 */}
        {streak > 0 && (
          <p className="mt-4 rounded-[12px] bg-orange-soft px-3.5 py-2.5 text-center text-[12.5px] leading-relaxed text-gold-ink">
            最厉害的一次：连续记录 <b>{streak}</b> 天没有断 ✨
          </p>
        )}

        {/* 年度心情 */}
        {moodCount.length > 0 && (
          <>
            <h2 className="mt-5 text-[13.5px] font-semibold text-ink">这一年的心情</h2>
            <div className="mt-2 space-y-1.5">
              {moodCount.slice(0, 4).map(([mood, count]) => {
                const max = moodCount[0][1];
                return (
                  <div key={mood} className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[12px] text-ink-2">{mood}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-border-soft">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#FFB4C3] to-[#F16D88]"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-[11px] text-ink-4">{count}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* 年度关键词 */}
        {topTags.length > 0 && (
          <>
            <h2 className="mt-5 text-[13.5px] font-semibold text-ink">年度关键词</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {topTags.map(([tag, count]) => (
                <span
                  key={tag}
                  className="rounded-full bg-pink-soft px-3 py-1 text-[12px] text-pink-ink"
                >
                  {tag} × {count}
                </span>
              ))}
            </div>
          </>
        )}

        {hasData && (
          <>
            {/* 逐月时间轴 */}
            <h2 className="mt-5 text-[13.5px] font-semibold text-ink">这一年，一个月一个月看</h2>
            <ol className="mt-3 space-y-0">
              {months.map((m) => (
                <li key={m.name} className="relative flex gap-3 pb-4 last:pb-0">
                  {/* 时间轴线 */}
                  <span className="absolute top-1.5 left-[5px] h-full w-px bg-border-strong last:hidden" />
                  <span
                    className={`relative z-10 mt-1 size-[11px] shrink-0 rounded-full border-2 ${
                      m.count > 0
                        ? "border-[#E96882] bg-pink-soft-2"
                        : "border-border-strong bg-white"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p
                        className={`text-[13px] font-semibold ${
                          m.count > 0 ? "text-ink" : "text-ink-5"
                        }`}
                      >
                        {m.name}
                      </p>
                      {m.count > 0 && (
                        <p className="shrink-0 text-[11px] text-ink-4">
                          {m.count} 条{m.topMood ? ` · ${m.topMood[0]}最多` : ""}
                          {m.inspCount > 0 ? ` · ${m.inspCount} 灵感` : ""}
                        </p>
                      )}
                    </div>
                    {m.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.photo}
                        alt={`${m.name}的代表照片`}
                        className="mt-1.5 h-16 w-24 rounded-[10px] object-cover"
                      />
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}

        {/* 照片长卷 */}
        {photos.length > 0 && (
          <>
            <h2 className="mt-5 text-[13.5px] font-semibold text-ink">{year} 的照片长卷</h2>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {photos.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={`照片 ${i + 1}`}
                  className="aspect-square w-full rounded-[8px] object-cover"
                />
              ))}
            </div>
          </>
        )}

        {!hasData && (
          <p className="mt-5 text-center text-[12.5px] text-ink-5">
            {year} 年还很安静，慢慢记录，年底回来看会很感动
          </p>
        )}
      </div>
    </div>
  );
}
