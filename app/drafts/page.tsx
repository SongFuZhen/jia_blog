"use client";

import { useEffect } from "react";
import { NotebookPen } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useRecordsStore } from "@/lib/stores/records";
import type { Mood } from "@/lib/types";

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

function formatDate(iso: string) {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return { date: `${mm}-${dd}`, weekday: weekdays[d.getDay()] };
}

export default function DraftsPage() {
  const records = useRecordsStore((s) => s.records);
  const hydrate = useRecordsStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const drafts = records.filter((r) => r.draft);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <PageHeader title="我的草稿" subtitle="没写完的，慢慢补" />

      {drafts.length === 0 ? (
        <div className="mt-8 flex flex-col items-center rounded-[20px] bg-card px-6 py-10 shadow-[var(--shadow-soft-sm)]">
          <span className="flex size-12 items-center justify-center rounded-full bg-pink-soft text-[#E0697E]">
            <NotebookPen className="size-6" strokeWidth={1.8} />
          </span>
          <p className="mt-3 text-[14px] font-medium text-ink">
            还没有草稿
          </p>
          <p className="mt-1 text-center text-[12px] text-ink-4">
            想到什么先存着，有空再来接着写
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {drafts.map((d) => {
            const { date, weekday } = formatDate(d.createdAt);
            return (
              <article
                key={d.id}
                className="flex gap-3.5 rounded-[16px] bg-card p-3.5 shadow-[var(--shadow-soft-sm)] transition-shadow hover:shadow-[var(--shadow-soft-md)]"
              >
                <div className="flex w-[44px] shrink-0 flex-col items-center justify-center rounded-[12px] bg-pink-soft py-2">
                  <span className="text-[15px] leading-none font-bold text-[#E0697E]">
                    {date}
                  </span>
                  <span className="mt-1 text-[11px] text-ink-4">
                    {weekday}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="truncate text-[15px] font-semibold text-ink">
                      {d.title || "无标题草稿"}
                    </h2>
                    {d.mood && (
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-[3px] text-[11px] leading-none ${moodClasses[moodTones[d.mood]]}`}
                      >
                        {d.mood}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-ink-2">
                    {d.content || "（还没有正文）"}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
