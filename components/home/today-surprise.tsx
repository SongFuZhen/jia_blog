"use client";

import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { useRecordsStore } from "@/lib/stores/records";
import { getSurprise } from "@/lib/surprises";
import type { Mood } from "@/lib/types";

/** 今日小惊喜 + 本月心情统计 */
export function TodaySurprise() {
  const records = useRecordsStore((s) => s.records);
  const hydrate = useRecordsStore((s) => s.hydrate);
  // getSurprise 按东八区日期确定性取值，服务端与客户端一致，无需 effect 重算
  const [surprise] = useState(() => getSurprise());

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthRecords = records.filter(
    (r) => !r.draft && r.createdAt.startsWith(monthPrefix),
  );

  const moodCount = new Map<Mood, number>();
  for (const r of monthRecords) {
    if (r.mood) moodCount.set(r.mood, (moodCount.get(r.mood) ?? 0) + 1);
  }
  const topMood = [...moodCount.entries()].sort((a, b) => b[1] - a[1])[0];

  return (
    <section className="mt-5 px-6 space-y-3">
      {/* 今日小惊喜 */}
      <div
        className={`flex items-center gap-3 rounded-[20px] p-4 shadow-[var(--shadow-soft-sm)] ${
          surprise.isAnniversary
            ? "bg-gradient-to-r from-pink-soft to-pink-soft-2"
            : "bg-gradient-to-r from-orange-soft to-orange-soft"
        }`}
      >
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-white ${
            surprise.isAnniversary ? "bg-[#D56983]" : "bg-[#F0A24B]"
          }`}
        >
          <Gift className="size-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-gold-ink">
            {surprise.isAnniversary ? "纪念日快乐" : "今日小惊喜"}
          </p>
          <p className="font-display mt-0.5 text-[14px] leading-snug text-ink-2">
            {surprise.text}
          </p>
        </div>
      </div>

      {/* 本月心情统计（有数据才显示） */}
      {monthRecords.length > 0 && (
        <p className="px-1 text-[12px] text-ink-4">
          这个月已经记录 {monthRecords.length} 条
          {topMood
            ? `，「${topMood[0]}」最多，有 ${topMood[1]} 次`
            : ""}
          ，一直在认真生活呀
        </p>
      )}
    </section>
  );
}
