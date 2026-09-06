"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookHeart,
  Brush,
  House,
  Lightbulb,
  Plus,
  Sprout,
  SquarePen,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";

const navLeft = [
  { label: "首页", icon: House, href: "/", fill: true },
  { label: "日记", icon: BookHeart, href: "/diary", fill: false },
];

const navRight = [
  { label: "美妆", icon: WandSparkles, href: "/beauty", fill: false },
  { label: "我的", icon: UserRound, href: "/me", fill: false },
];

const sheetOptions = [
  {
    label: "写日记",
    desc: "心情 · 碎碎念",
    icon: SquarePen,
    href: "/diary",
    iconColor: "text-[#E0697E]",
    bg: "bg-[#FDECEC]",
  },
  {
    label: "记美妆",
    desc: "教程 · 好物",
    icon: Brush,
    href: "/beauty",
    iconColor: "text-[#8B63D9]",
    bg: "bg-[#F4ECFD]",
  },
  {
    label: "存灵感",
    desc: "美图 · 喜欢",
    icon: Lightbulb,
    href: "/inspiration",
    iconColor: "text-[#F08A4B]",
    bg: "bg-[#FDEFE8]",
  },
  {
    label: "加清单",
    desc: "变美 · 学习",
    icon: Sprout,
    href: "/growth",
    iconColor: "text-[#4E9A6E]",
    bg: "bg-[#E9F3EC]",
  },
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
          ? "bg-[#FDECEC] text-[#F16D88]"
          : "text-[#8A7A72] hover:bg-[#FFF5F2] hover:text-[#F16D88]"
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
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50">
        <div className="mx-auto w-full max-w-[430px] px-4 pb-4">
          <div className="relative flex h-12 items-center justify-between rounded-[24px] border border-white/60 bg-white/65 px-2 shadow-[0_10px_30px_rgba(91,61,51,0.10)] backdrop-blur-xl">
            {navLeft.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                active={pathname === item.href}
              />
            ))}

            {/* 中央新建按钮：山丘造型，凸出 1/3，点击旋转成 × */}
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="新建记录"
              className="relative mx-1 flex size-[46px] shrink-0 -translate-y-[14px] items-center justify-center rounded-[50%_50%_46%_54%/64%_64%_36%_36%] border-2 border-white bg-gradient-to-b from-[#FF92A8] to-[#F16D88] text-white shadow-[0_6px_16px_rgba(242,111,134,0.42)] transition-all duration-300 ease-out hover:scale-105 active:scale-95"
            >
              <Plus
                className={`size-5 transition-transform duration-300 ease-out ${
                  open ? "rotate-[135deg]" : ""
                }`}
                strokeWidth={2.4}
              />
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

      {/* 新建记录面板 */}
      {open && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-[#3B2E2A]/30 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[430px] p-4">
            <div className="rounded-[28px] bg-white p-5 pb-6 shadow-[var(--shadow-soft-lg)]">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#EBDCD5]" />
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[17px] font-bold text-[#3B2E2A]">
                    新建记录
                  </h3>
                  <p className="mt-0.5 text-[12.5px] text-[#A8928B]">
                    今天也想被好好记录下来
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="关闭"
                  className="flex size-7 items-center justify-center rounded-full bg-[#F7F0EC] text-[#8A7A72] transition-colors hover:bg-[#FDECEC] hover:text-[#E0697E]"
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {sheetOptions.map((opt) => (
                  <Link
                    key={opt.label}
                    href={opt.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-2xl border border-[#F6EFEC] p-3.5 transition-colors hover:bg-[#FFF8F5]"
                  >
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-full ${opt.bg}`}
                    >
                      <opt.icon
                        className={`size-5 ${opt.iconColor}`}
                        strokeWidth={1.8}
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14.5px] font-semibold text-[#3B2E2A]">
                        {opt.label}
                      </span>
                      <span className="block text-[11.5px] text-[#A8928B]">
                        {opt.desc}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
