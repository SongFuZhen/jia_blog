"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  Bookmark,
  Cat,
  ChevronRight,
  History,
  Info,
  Lock,
  NotebookPen,
  Settings,
  UtensilsCrossed,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useRecordsStore } from "@/lib/stores/records";
import { useInspirationStore } from "@/lib/stores/inspiration";
import { useBeautyStore } from "@/lib/stores/beauty";

const menus = [
  { label: "我的草稿", icon: NotebookPen, href: "/drafts" },
  { label: "时光轴", icon: History, href: "/timeline" },
  { label: "美食记录", icon: UtensilsCrossed, href: "/food" },
  { label: "我的收藏", icon: Bookmark, href: "/inspiration" },
  { label: "回顾 · 月报年报", icon: BarChart3, href: "/review" },
  { label: "设置", icon: Settings, href: "/settings" },
  { label: "帮助与关于", icon: Info, href: "/settings" },
];

export default function MePage() {
  const records = useRecordsStore((s) => s.records);
  const recordsHydrate = useRecordsStore((s) => s.hydrate);
  const inspirations = useInspirationStore((s) => s.items);
  const inspHydrate = useInspirationStore((s) => s.hydrate);
  const products = useBeautyStore((s) => s.products);
  const beautyHydrate = useBeautyStore((s) => s.hydrate);

  useEffect(() => {
    recordsHydrate();
    inspHydrate();
    beautyHydrate();
  }, [recordsHydrate, inspHydrate, beautyHydrate]);

  const stats = [
    { num: records.filter((r) => !r.draft).length, label: "日记" },
    { num: inspirations.length, label: "灵感" },
    { num: products.length, label: "美妆柜" },
  ];

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <PageHeader title="我的" />

      {/* 个人信息 */}
      <div className="mt-5 flex items-center gap-4 rounded-[20px] bg-card p-4 shadow-[var(--shadow-soft-sm)]">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-pink-soft">
          <Cat className="size-8 text-[#E0697E]" strokeWidth={1.6} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold text-ink">小佳佳</h2>
          <p className="font-display mt-0.5 text-[13.5px] text-ink-3">
            做更喜欢自己的女孩
          </p>
        </div>
      </div>

      {/* 数据统计 */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center rounded-[16px] bg-card py-3.5 shadow-[var(--shadow-soft-sm)]"
          >
            <span className="text-[18px] leading-none font-bold text-[#E0697E]">
              {s.num}
            </span>
            <span className="mt-1.5 text-[11.5px] text-ink-4">{s.label}</span>
          </div>
        ))}
      </div>

      {/* 私密空间入口 */}
      <Link
        href="/private"
        className="mt-4 flex items-center gap-3 rounded-[20px] bg-gradient-to-r from-pink-soft to-pink-soft-2 p-4 shadow-[var(--shadow-soft-sm)] transition-shadow hover:shadow-[var(--shadow-soft-md)]"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#D56983] text-white">
          <Lock className="size-5" strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-ink">
            专属私密空间
          </span>
          <span className="mt-0.5 block text-[12px] text-ink-4">
            体重 · 经期 · 更多属于你的小秘密
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-ink-3" />
      </Link>

      {/* 菜单 */}
      <div className="mt-4 overflow-hidden rounded-[20px] bg-card shadow-[var(--shadow-soft-sm)]">
        {menus.map((m, i) => (
          <Link
            key={m.label}
            href={m.href}
            className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-card-hover ${
              i > 0 ? "border-t border-border-soft" : ""
            }`}
          >
            <m.icon className="size-5 text-ink-3" strokeWidth={1.8} />
            <span className="flex-1 text-[14.5px] font-medium text-ink">
              {m.label}
            </span>
            <ChevronRight className="size-4 text-ink-5" />
          </Link>
        ))}
      </div>

      <p className="font-display mt-6 text-center text-[14.5px] text-ink-5">
        不必很完美 · 只需做自己
      </p>
    </main>
  );
}
