"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { Camera, MapPin, Star } from "lucide-react";
import { Loading } from "@/components/loading";
import { PageHeader } from "@/components/page-header";
import { useRecordsStore } from "@/lib/stores/records";
import type { ImageMeta, LifeRecord } from "@/lib/types";

type ItemKind = "photo" | "milestone" | "record";

interface TimelineItem {
  /** 排序用的时刻：照片取拍摄时间，里程碑取记录时间 */
  date: string;
  kind: ItemKind;
  record: LifeRecord;
  image?: string;
  meta?: ImageMeta;
}

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

function isMilestone(r: LifeRecord): boolean {
  return (
    r.tags.includes("第一次") ||
    r.title.includes("第一次") ||
    r.content.includes("第一次")
  );
}

export default function TimelinePage() {
  const records = useRecordsStore((s) => s.records);
  const hydrated = useRecordsStore((s) => s.hydrated);
  const hydrate = useRecordsStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const items = useMemo<TimelineItem[]>(() => {
    const list: TimelineItem[] = [];
    for (const r of records) {
      if (r.draft) continue;
      // 照片瞬间：每张带拍摄时间的图都是一个节点
      for (const src of r.images) {
        const meta = r.imageMeta?.find((m) => m.url === src);
        list.push({
          date: meta?.takenAt ?? r.createdAt,
          kind: "photo",
          record: r,
          image: src,
          meta,
        });
      }
      // 里程碑：带「第一次」的记录（没有图片也成立）
      if (isMilestone(r)) {
        list.push({ date: r.createdAt, kind: "milestone", record: r });
      }
      // 无图又非里程碑的记录：作为普通节点，避免时间轴只有图没有事
      if (r.images.length === 0 && !isMilestone(r)) {
        list.push({ date: r.createdAt, kind: "record", record: r });
      }
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [records]);

  const groups = useMemo(() => {
    const map = new Map<string, TimelineItem[]>();
    for (const it of items) {
      const key = it.date.slice(0, 7);
      const arr = map.get(key) ?? [];
      arr.push(it);
      map.set(key, arr);
    }
    return [...map.entries()];
  }, [items]);

  const photoCount = items.filter((i) => i.kind === "photo").length;
  const milestoneCount = items.filter((i) => isMilestone(i.record)).length;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <PageHeader title="时光轴" subtitle="把日子串成一条线" />

      {/* 概览 */}
      <div className="mt-4 flex items-center justify-between rounded-[16px] bg-gradient-to-r from-pink-soft to-pink-soft-2 p-4 shadow-[var(--shadow-soft-sm)]">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#D56983] text-white">
            <Camera className="size-5" strokeWidth={1.8} />
          </span>
          <div>
            <p className="text-[14px] font-semibold text-ink">
              {items.length} 个瞬间
            </p>
            <p className="mt-0.5 text-[11.5px] text-ink-4">
              {photoCount} 张照片 · {milestoneCount} 个「第一次」
            </p>
          </div>
        </div>
      </div>

      {!hydrated ? (
        <Loading />
      ) : groups.length === 0 ? (
        <p className="mt-10 text-center text-[13px] text-ink-4">
          时间轴还是空的，去记录一些瞬间吧
        </p>
      ) : (
        groups.map(([month, list]) => (
          <section key={month} className="mt-6">
            <h2 className="px-1 text-[13px] font-semibold text-ink-3">
              {month.slice(0, 4)} 年 {monthNames[Number(month.slice(5, 7)) - 1]}
            </h2>

            <ol className="relative mt-3 space-y-4">
              {/* 时间轴线 */}
              <span className="absolute top-2 left-[7px] h-full w-px bg-border-strong" />
              {list.map((it, i) => (
                <li
                  key={`${it.record.id}-${it.date}-${i}`}
                  className="relative flex gap-3.5"
                >
                  {/* 节点 */}
                  <span
                    className={`relative z-10 mt-1.5 size-[15px] shrink-0 rounded-full border-2 ${
                      it.kind === "milestone"
                        ? "border-[#F0A24B] bg-[#FFE9C8]"
                        : it.image
                          ? "border-[#E96882] bg-[#FFD3DE]"
                          : "border-ink-4 bg-background"
                    }`}
                  >
                    {it.kind === "milestone" && (
                      <Star className="absolute -top-1 -left-1 size-2.5 fill-[#F0A24B] text-[#F0A24B]" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-ink-4">
                      {it.date.slice(0, 10)}
                      {it.meta?.location && (
                        <span className="ml-1.5 inline-flex items-center gap-0.5 text-[#E0697E]">
                          <MapPin className="size-3" strokeWidth={1.8} />
                          {it.meta.location}
                        </span>
                      )}
                    </p>

                    {it.image ? (
                      <Link
                        href={`/record/${it.record.id}`}
                        className="mt-1 block rounded-[14px] bg-card p-2 shadow-[var(--shadow-soft-sm)] transition-shadow hover:shadow-[var(--shadow-soft-md)]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={it.image}
                          alt={it.record.title}
                          className="max-h-[200px] w-full rounded-[10px] object-cover"
                        />
                        <p className="mt-1.5 truncate px-1 text-[12.5px] font-medium text-ink">
                          {it.record.title}
                        </p>
                      </Link>
                    ) : (
                      <Link
                        href={`/record/${it.record.id}`}
                        className="mt-1 block rounded-[14px] bg-card px-3.5 py-2.5 shadow-[var(--shadow-soft-sm)] transition-shadow hover:shadow-[var(--shadow-soft-md)]"
                      >
                        <p className="truncate text-[13.5px] font-semibold text-ink">
                          {it.record.title}
                          {it.kind === "milestone" && (
                            <span className="ml-1.5 rounded-full bg-orange-soft px-2 py-[2px] text-[10px] font-medium text-gold-ink">
                              第一次
                            </span>
                          )}
                        </p>
                        {it.record.content && (
                          <p className="mt-0.5 line-clamp-1 text-[12px] text-ink-3">
                            {it.record.content}
                          </p>
                        )}
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))
      )}
    </main>
  );
}
