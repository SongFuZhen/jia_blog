"use client";

import Link from "next/link";
import { Mic2, Newspaper, PenLine, Utensils } from "lucide-react";

const entries = [
  {
    title: "看今朝",
    icon: Newspaper,
    href: "/today",
    iconColor: "text-orange-ink",
    bg: "bg-orange-soft",
  },
  {
    title: "随便记",
    icon: PenLine,
    href: "/note",
    iconColor: "text-purple-ink",
    bg: "bg-purple-soft",
  },
  {
    title: "吃美食",
    icon: Utensils,
    href: "/food",
    iconColor: "text-[#E0697E]",
    bg: "bg-pink-soft",
  },
  {
    title: "嗨翻天",
    icon: Mic2,
    href: "/shows",
    iconColor: "text-green-ink",
    bg: "bg-green-soft",
  },
];

export function QuickEntries() {
  return (
    <section className="relative z-10 -mt-[70px] px-6">
      <div className="grid grid-cols-4 gap-2 rounded-[18px] bg-card px-2 pt-4 pb-3 shadow-[var(--shadow-soft-sm)]">
        {entries.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group flex flex-col items-center"
          >
            <span
              className={`flex size-[46px] items-center justify-center rounded-full ${item.bg}`}
            >
              <item.icon className={`size-[22px] ${item.iconColor}`} strokeWidth={1.8} />
            </span>
            <span className="mt-2 text-[14px] font-semibold text-ink">
              {item.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

