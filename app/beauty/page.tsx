import {
  Brush,
  Clock,
  Droplets,
  Gift,
  Heart,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";

const filters = ["全部", "教程", "好物", "种草", "护肤"];

const cards = [
  {
    title: "温柔奶茶妆教程",
    icon: Brush,
    thumb: "from-[#F6E7FB] to-[#EFE0FC]",
    iconColor: "text-[#8B63D9]",
    tag: "教程",
    tagClass: "bg-[#F2E9FE] text-[#8B5FD6]",
    likes: 382,
  },
  {
    title: "干皮护肤回购清单",
    icon: Droplets,
    thumb: "from-[#FFE9EE] to-[#FFDCE5]",
    iconColor: "text-[#E0697E]",
    tag: "护肤",
    tagClass: "bg-[#FEF0EE] text-[#D95570]",
    likes: 256,
  },
  {
    title: "新手化妆刷选购指南",
    icon: Sparkles,
    thumb: "from-[#FDEFE0] to-[#FBE4CC]",
    iconColor: "text-[#F08A4B]",
    tag: "好物",
    tagClass: "bg-[#FEF4EC] text-[#E07A3F]",
    likes: 198,
  },
  {
    title: "持妆 8 小时的小技巧",
    icon: Clock,
    thumb: "from-[#FFEFE8] to-[#FFDFD2]",
    iconColor: "text-[#E07A5F]",
    tag: "教程",
    tagClass: "bg-[#F2E9FE] text-[#8B5FD6]",
    likes: 421,
  },
  {
    title: "平价好物合集",
    icon: Gift,
    thumb: "from-[#E7F3EB] to-[#D5EBDE]",
    iconColor: "text-[#4E9A6E]",
    tag: "好物",
    tagClass: "bg-[#FEF4EC] text-[#E07A3F]",
    likes: 173,
  },
  {
    title: "唇釉试色收藏",
    icon: Heart,
    thumb: "from-[#FFE4EA] to-[#FFD3DE]",
    iconColor: "text-[#D56983]",
    tag: "种草",
    tagClass: "bg-[#E4F1FB] text-[#4E96DB]",
    likes: 309,
  },
];

export const metadata = { title: "美妆 · 小嘉的生活日记" };

export default function BeautyPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <PageHeader title="美妆手册" subtitle="变美的路上慢慢走" />

      {/* 筛选标签 */}
      <div className="mt-5 flex gap-2">
        {filters.map((f, i) => (
          <button
            key={f}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
              i === 0
                ? "bg-[#F16D88] text-white"
                : "bg-white text-[#8A7A72] shadow-[var(--shadow-xs)] hover:text-[#F16D88]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 卡片墙 */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <article
            key={c.title}
            className="overflow-hidden rounded-[16px] bg-[#FEFCFB] shadow-[var(--shadow-soft-sm)] transition-shadow hover:shadow-[var(--shadow-soft-md)]"
          >
            <div
              className={`flex aspect-[4/3] items-center justify-center bg-gradient-to-br ${c.thumb}`}
            >
              <c.icon className={`size-9 ${c.iconColor}`} strokeWidth={1.5} />
            </div>
            <div className="p-3">
              <h2 className="truncate text-[14px] font-semibold text-[#2E2422]">
                {c.title}
              </h2>
              <div className="mt-2 flex items-center justify-between">
                <span
                  className={`rounded-full px-2 py-[3px] text-[11px] leading-none ${c.tagClass}`}
                >
                  {c.tag}
                </span>
                <span className="inline-flex items-center gap-1 text-[11.5px] text-[#A8928B]">
                  <Heart className="size-3.5" strokeWidth={1.8} />
                  {c.likes}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
