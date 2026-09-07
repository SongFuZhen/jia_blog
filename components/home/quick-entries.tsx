"use client";

import Link from "next/link";
import { Brush, Image as ImageIcon, SquarePen, Sprout } from "lucide-react";
import { useComposeStore } from "@/lib/stores/ui";

const entries = [
  {
    title: "日常记录",
    icon: SquarePen,
    href: "/diary",
    compose: "diary" as const,
    iconColor: "text-[#E0697E]",
    bg: "bg-pink-soft",
  },
  {
    title: "化妆技巧",
    icon: Brush,
    href: "/beauty",
    compose: null,
    iconColor: "text-purple-ink",
    bg: "bg-purple-soft",
  },
  {
    title: "灵感收藏",
    icon: ImageIcon,
    href: "/inspiration",
    compose: null,
    iconColor: "text-orange-ink",
    bg: "bg-orange-soft",
  },
  {
    title: "成长清单",
    icon: Sprout,
    href: "/growth",
    compose: null,
    iconColor: "text-green-ink",
    bg: "bg-green-soft",
  },
];

export function QuickEntries() {
  const openCompose = useComposeStore((s) => s.openCompose);

  return (
    <section className="relative z-10 -mt-[70px] px-6">
      <div className="grid grid-cols-4 gap-2 rounded-[18px] bg-card px-2 pt-4 pb-3 shadow-[var(--shadow-soft-sm)]">
        {entries.map((item) =>
          item.compose ? (
            <button
              key={item.title}
              onClick={() => openCompose(item.compose!)}
              className="group flex flex-col items-center"
            >
              <span
                className={`flex size-[46px] items-center justify-center rounded-full ${item.bg} transition-transform group-hover:scale-105`}
              >
                <item.icon className={`size-[22px] ${item.iconColor}`} strokeWidth={1.8} />
              </span>
              <span className="mt-2 text-[14px] font-semibold text-ink">
                {item.title}
              </span>
            </button>
          ) : (
            <Link
              key={item.title}
              href={item.href}
              className="group flex flex-col items-center"
            >
              <span
                className={`flex size-[46px] items-center justify-center rounded-full ${item.bg} transition-transform group-hover:scale-105`}
              >
                <item.icon className={`size-[22px] ${item.iconColor}`} strokeWidth={1.8} />
              </span>
              <span className="mt-2 text-[14px] font-semibold text-ink">
                {item.title}
              </span>
            </Link>
          ),
        )}
      </div>
    </section>
  );
}

