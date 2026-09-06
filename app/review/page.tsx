"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useRecordsStore } from "@/lib/stores/records";
import { useInspirationStore } from "@/lib/stores/inspiration";
import { useBeautyStore } from "@/lib/stores/beauty";
import { useSettingsStore } from "@/lib/stores/settings";
import type { Mood } from "@/lib/types";

export default function ReviewPage() {
  const { records, hydrate } = useRecordsStore();
  const { items: inspirations, hydrate: hydrateInsp } = useInspirationStore();
  const { tips, hydrate: hydrateBeauty } = useBeautyStore();
  const { settings, hydrate: hydrateSettings } = useSettingsStore();

  const now = new Date();
  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  );

  useEffect(() => {
    hydrate();
    hydrateInsp();
    hydrateBeauty();
    hydrateSettings();
  }, [hydrate, hydrateInsp, hydrateBeauty, hydrateSettings]);

  const monthRecords = useMemo(
    () => records.filter((r) => !r.draft && r.createdAt.startsWith(month)),
    [records, month],
  );
  const monthInspirations = inspirations.filter((i) =>
    i.createdAt.startsWith(month),
  );
  const triedTips = tips.filter((t) => t.triedAt?.startsWith(month));

  const moodCount = useMemo(() => {
    const map = new Map<Mood, number>();
    for (const r of monthRecords) {
      if (r.mood) map.set(r.mood, (map.get(r.mood) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [monthRecords]);

  const topTags = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of monthRecords) {
      for (const t of r.tags) map.set(t, (map.get(t) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [monthRecords]);

  const photos = monthRecords.flatMap((r) => r.images).slice(0, 4);

  function shiftMonth(delta: number) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const [year, monthNum] = month.split("-");
  const isFuture =
    month >= `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <PageHeader title="月度回顾" subtitle="原来这个月变了这么多" />

      {/* 月份切换 */}
      <div className="mt-4 flex items-center justify-between rounded-full bg-white px-2 py-1.5 shadow-[var(--shadow-xs)]">
        <button
          onClick={() => shiftMonth(-1)}
          aria-label="上个月"
          className="flex size-8 items-center justify-center rounded-full text-[#8A7A72] hover:bg-[#FFF5F2] hover:text-[#E0697E]"
        >
          <ArrowLeft className="size-4" strokeWidth={1.8} />
        </button>
        <p className="text-[14.5px] font-bold text-[#3B2E2A]">
          {year} 年 {Number(monthNum)} 月
        </p>
        <button
          onClick={() => shiftMonth(1)}
          disabled={isFuture}
          aria-label="下个月"
          className="flex size-8 items-center justify-center rounded-full text-[#8A7A72] hover:bg-[#FFF5F2] hover:text-[#E0697E] disabled:opacity-30"
        >
          <ArrowRight className="size-4" strokeWidth={1.8} />
        </button>
      </div>

      {/* 生活小报 */}
      <div className="mt-4 rounded-[20px] bg-[#FEFCFB] p-5 shadow-[var(--shadow-soft-sm)]">
        <p className="font-display text-center text-[18px] font-bold text-[#9F3E56]">
          {settings.nickname}的 {Number(monthNum)} 月生活小报
        </p>
        <div className="mx-auto mt-2 h-px w-16 bg-[#F5B8C4]" />

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-[14px] bg-[#FFF9F6] py-3">
            <p className="text-[20px] font-bold text-[#E0697E]">{monthRecords.length}</p>
            <p className="mt-0.5 text-[11px] text-[#A8928B]">条记录</p>
          </div>
          <div className="rounded-[14px] bg-[#FFF9F6] py-3">
            <p className="text-[20px] font-bold text-[#8B63D9]">{monthInspirations.length}</p>
            <p className="mt-0.5 text-[11px] text-[#A8928B]">个灵感</p>
          </div>
          <div className="rounded-[14px] bg-[#FFF9F6] py-3">
            <p className="text-[20px] font-bold text-[#4E9A6E]">{triedTips.length}</p>
            <p className="mt-0.5 text-[11px] text-[#A8928B]">次美妆尝试</p>
          </div>
        </div>

        {/* 心情分布 */}
        {moodCount.length > 0 && (
          <>
            <h2 className="mt-5 text-[13.5px] font-semibold text-[#3B2E2A]">心情天气图</h2>
            <div className="mt-2 space-y-1.5">
              {moodCount.slice(0, 4).map(([mood, count]) => {
                const max = moodCount[0][1];
                return (
                  <div key={mood} className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[12px] text-[#7A6A63]">{mood}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#F7EDE8]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#FFB4C3] to-[#F16D88]"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-[11px] text-[#A8928B]">{count}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* 高频标签 */}
        {topTags.length > 0 && (
          <>
            <h2 className="mt-5 text-[13.5px] font-semibold text-[#3B2E2A]">这个月在忙什么</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {topTags.map(([tag, count]) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#FEF0EE] px-3 py-1 text-[12px] text-[#D95570]"
                >
                  {tag} × {count}
                </span>
              ))}
            </div>
          </>
        )}

        {/* 照片墙 */}
        {photos.length > 0 && (
          <>
            <h2 className="mt-5 text-[13.5px] font-semibold text-[#3B2E2A]">照片角落</h2>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {photos.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={`照片 ${i + 1}`}
                  className="aspect-square w-full rounded-[12px] object-cover"
                />
              ))}
            </div>
          </>
        )}

        {monthRecords.length === 0 && monthInspirations.length === 0 && (
          <p className="mt-5 text-center text-[12.5px] text-[#C9B8B2]">
            这个月还很安静，去写下点什么吧
          </p>
        )}
      </div>
    </main>
  );
}
