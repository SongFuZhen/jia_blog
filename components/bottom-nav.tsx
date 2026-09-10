"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookHeart, House, UserRound, WandSparkles } from "lucide-react";

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
