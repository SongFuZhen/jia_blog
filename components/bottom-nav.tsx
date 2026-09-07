"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookHeart, House, Plus, UserRound, WandSparkles } from "lucide-react";
import { useComposeStore } from "@/lib/stores/ui";

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
      className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl px-3.5 transition-all ${
        active
          ? "bg-pink-soft text-[#F16D88]"
          : "text-ink-3 hover:bg-card-hover hover:text-[#F16D88]"
      }`}
    >
      <Icon
        className="size-[19px]"
        strokeWidth={active ? 2.1 : 1.8}
        fill={active && fill ? "currentColor" : "none"}
      />
      <span className="text-[10.5px] font-medium">{label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const openCompose = useComposeStore((s) => s.openCompose);

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

          {/* 中央新建按钮：山丘造型，凸出 1/3；按下时预热编辑器 chunk，弹层秒开 */}
          <button
            onClick={() => openCompose("diary")}
            onPointerDown={() => {
              import("@/components/compose-sheet").catch(() => {});
            }}
            aria-label="新建记录"
            className="relative mx-1 flex size-[46px] shrink-0 -translate-y-[14px] items-center justify-center rounded-[50%_50%_46%_54%/64%_64%_36%_36%] border-2 border-white bg-gradient-to-b from-[#FF92A8] to-[#F16D88] text-white shadow-[0_6px_16px_rgba(242,111,134,0.42)] transition-all duration-300 ease-out hover:scale-105 active:scale-95"
          >
            <Plus strokeWidth={2.4} className="size-5" />
          </button>

          {navRight.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={pathname.startsWith(item.href)}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}
