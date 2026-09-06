import Link from "next/link";
import { Brush, Image as ImageIcon, SquarePen, Sprout } from "lucide-react";

const entries = [
  {
    title: "日常记录",
    icon: SquarePen,
    href: "/diary",
    iconColor: "text-[#E0697E]",
    bg: "bg-[#FDECEC]",
  },
  {
    title: "化妆技巧",
    icon: Brush,
    href: "/beauty",
    iconColor: "text-[#8B63D9]",
    bg: "bg-[#F4ECFD]",
  },
  {
    title: "灵感收藏",
    icon: ImageIcon,
    href: "/inspiration",
    iconColor: "text-[#F08A4B]",
    bg: "bg-[#FDEFE8]",
  },
  {
    title: "成长清单",
    icon: Sprout,
    href: "/growth",
    iconColor: "text-[#4E9A6E]",
    bg: "bg-[#E9F3EC]",
  },
];

export function QuickEntries() {
  return (
    <section className="relative z-10 -mt-[70px] px-6">
      <div className="grid grid-cols-4 gap-2 rounded-[18px] bg-[#FEFCFB] px-2 pt-4 pb-3 shadow-[var(--shadow-soft-sm)]">
        {entries.map((item) => (
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
            <span className="mt-2 text-[14px] font-semibold text-[#3B2E2A]">
              {item.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
