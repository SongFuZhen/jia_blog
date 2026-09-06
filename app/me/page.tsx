import Link from "next/link";
import {
  BarChart3,
  Bookmark,
  Cat,
  ChevronRight,
  Info,
  Lock,
  NotebookPen,
  Settings,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";

const stats = [
  { num: 128, label: "日记" },
  { num: 56, label: "灵感" },
  { num: 89, label: "收藏" },
];

const menus = [
  { label: "我的草稿", icon: NotebookPen, href: "/drafts" },
  { label: "我的收藏", icon: Bookmark, href: "/inspiration" },
  { label: "月度回顾", icon: BarChart3, href: "/review" },
  { label: "设置", icon: Settings, href: "/settings" },
  { label: "帮助与关于", icon: Info, href: "/settings" },
];

export const metadata = { title: "我的 · 小佳佳的生活日记" };

export default function MePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <PageHeader title="我的" />

      {/* 个人信息 */}
      <div className="mt-5 flex items-center gap-4 rounded-[20px] bg-[#FEFCFB] p-4 shadow-[var(--shadow-soft-sm)]">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[#FDECEC]">
          <Cat className="size-8 text-[#E0697E]" strokeWidth={1.6} />
        </span>
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold text-[#3B2E2A]">小佳佳</h2>
          <p className="font-display mt-0.5 text-[13.5px] text-[#B79A90]">
            做更喜欢自己的女孩
          </p>
        </div>
      </div>

      {/* 数据统计 */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center rounded-[16px] bg-[#FEFCFB] py-3.5 shadow-[var(--shadow-soft-sm)]"
          >
            <span className="text-[18px] leading-none font-bold text-[#E0697E]">
              {s.num}
            </span>
            <span className="mt-1.5 text-[11.5px] text-[#A8928B]">{s.label}</span>
          </div>
        ))}
      </div>

      {/* 私密空间入口 */}
      <Link
        href="/private"
        className="mt-4 flex items-center gap-3 rounded-[20px] bg-gradient-to-r from-[#FEEBEE] to-[#FBE5EC] p-4 shadow-[var(--shadow-soft-sm)] transition-shadow hover:shadow-[var(--shadow-soft-md)]"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#D56983] text-white">
          <Lock className="size-5" strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-[#3B2E2A]">
            专属私密空间
          </span>
          <span className="mt-0.5 block text-[12px] text-[#A8928B]">
            体重 · 经期 · 更多属于你的小秘密
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-[#C9989E]" />
      </Link>

      {/* 菜单 */}
      <div className="mt-4 overflow-hidden rounded-[20px] bg-[#FEFCFB] shadow-[var(--shadow-soft-sm)]">
        {menus.map((m, i) => (
          <Link
            key={m.label}
            href={m.href}
            className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#FFF8F5] ${
              i > 0 ? "border-t border-[#F6EFEC]" : ""
            }`}
          >
            <m.icon className="size-5 text-[#B08A80]" strokeWidth={1.8} />
            <span className="flex-1 text-[14.5px] font-medium text-[#3B2E2A]">
              {m.label}
            </span>
            <ChevronRight className="size-4 text-[#D8C7C0]" />
          </Link>
        ))}
      </div>

      <p className="font-display mt-6 text-center text-[14.5px] text-[#CBB3AA]">
        不必很完美 · 只需做自己
      </p>
    </main>
  );
}
