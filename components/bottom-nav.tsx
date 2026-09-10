"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookHeart, House, Mic, UserRound, WandSparkles } from "lucide-react";
import { useState } from "react";
import { AiChatSheet } from "@/components/ai-chat-sheet";

const navLeft = [
  { label: "首页", icon: House, href: "/", fill: true },
  { label: "日记", icon: BookHeart, href: "/diary", fill: false },
];

const navRight = [
  { label: "美妆", icon: WandSparkles, href: "/beauty", fill: false },
  { label: "我的", icon: UserRound, href: "/me", fill: false },
];

function NavItem({
  label,
  icon: Icon,
  href,
  fill,
  active,
}: {
  label: string;
  icon: typeof House;
  href: string;
  fill: boolean;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative flex flex-col items-center justify-center gap-0.5 rounded-[18px] px-3.5 py-1 transition-all duration-300 ${
        active
          ? "bg-gradient-to-b from-pink-soft to-pink-soft-2 text-[#F16D88] shadow-[0_4px_14px_rgba(242,111,134,0.22)]"
          : "text-ink-3 hover:bg-card-hover hover:text-[#F16D88]"
      }`}
    >
      <Icon
        className={`size-[19px] transition-transform duration-300 ${
          active ? "scale-110 -translate-y-px" : ""
        }`}
        strokeWidth={active ? 2.1 : 1.8}
        fill={active && fill ? "currentColor" : "none"}
      />
      <span
        className={`text-[10.5px] ${active ? "font-semibold" : "font-medium"}`}
      >
        {label}
      </span>
      {/* 选中指示小圆点 */}
      <span
        className={`absolute bottom-[3px] size-1 rounded-full bg-[#F16D88] transition-all duration-300 ${
          active ? "scale-100 opacity-100" : "scale-0 opacity-0"
        }`}
      />
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto w-full max-w-[430px] px-4 pb-4">
        <div className="relative flex h-12 items-center justify-between rounded-[24px] border border-white/60 bg-white/65 dark:border-[#3A2E31] dark:bg-[#241B1E]/75 px-2 shadow-[0_10px_30px_rgba(91,61,51,0.10)] backdrop-blur-xl">
          {navLeft.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={pathname === item.href}
            />
          ))}

          {/* 中央 AI 语音助手入口：山丘造型，凸出 1/3 */}
          <button
            onClick={() => setAiOpen(true)}
            aria-label="AI 聊天"
            className="relative mx-1 flex size-[46px] shrink-0 -translate-y-[14px] items-center justify-center rounded-[50%_50%_46%_54%/64%_64%_36%_36%] border-2 border-white bg-gradient-to-b from-[#FF92A8] to-[#F16D88] text-white shadow-[0_6px_16px_rgba(242,111,134,0.42)] transition-all duration-300 ease-out hover:scale-105 active:scale-95"
          >
            <Mic strokeWidth={2.4} className="size-5" />
          </button>

          {navRight.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={pathname.startsWith(item.href)}
            />
          ))}

          <AiChatSheet open={aiOpen} onClose={() => setAiOpen(false)} />
        </div>
      </div>
    </nav>
  );
}
