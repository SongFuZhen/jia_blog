import { Camera, Image as ImageIcon, Music, Quote } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const filters = ["全部", "文字", "美图", "瞬间"];

const items = [
  {
    type: "文字",
    tagClass: "bg-[#F2E9FE] text-[#8B5FD6]",
    icon: Quote,
    bg: "bg-gradient-to-br from-[#F6E7FB] to-[#EFE0FC]",
    height: "h-[150px]",
    content:
      "“你爬山不是为了登顶，而是为了看看路上的花开了没有。”",
    big: true,
  },
  {
    type: "美图",
    tagClass: "bg-[#FEF0EE] text-[#D95570]",
    icon: ImageIcon,
    bg: "bg-gradient-to-br from-[#FFE4EA] to-[#FFD3DE]",
    height: "h-[110px]",
    content: "晚霞收集者",
    big: false,
  },
  {
    type: "瞬间",
    tagClass: "bg-[#E9F3EC] text-[#4E9A6E]",
    icon: Camera,
    bg: "bg-gradient-to-br from-[#E7F3EB] to-[#D5EBDE]",
    height: "h-[120px]",
    content: "猫咪踩了我一脸",
    big: false,
  },
  {
    type: "文字",
    tagClass: "bg-[#F2E9FE] text-[#8B5FD6]",
    icon: Quote,
    bg: "bg-gradient-to-br from-[#FDEFE0] to-[#FBE4CC]",
    height: "h-[130px]",
    content: "“慢慢来，谁还没有一段黎明前的路要走呢。”",
    big: true,
  },
  {
    type: "美图",
    tagClass: "bg-[#FEF0EE] text-[#D95570]",
    icon: ImageIcon,
    bg: "bg-gradient-to-br from-[#FDEFE8] to-[#FFDFD2]",
    height: "h-[105px]",
    content: "窗边的光",
    big: false,
  },
  {
    type: "瞬间",
    tagClass: "bg-[#E9F3EC] text-[#4E9A6E]",
    icon: Music,
    bg: "bg-gradient-to-br from-[#FFE9EE] to-[#FFDCE5]",
    height: "h-[140px]",
    content: "单曲循环的日落歌单",
    big: true,
  },
];

export const metadata = { title: "灵感收藏 · 小佳佳的生活日记" };

export default function InspirationPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <PageHeader title="灵感收藏" subtitle="喜欢的都装进小口袋" />

      {/* 筛选 */}
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

      {/* 瀑布流卡片 */}
      <div className="mt-4 columns-2 gap-3 [&>*]:mb-3">
        {items.map((it, idx) => (
          <article
            key={idx}
            className="break-inside-avoid overflow-hidden rounded-[16px] bg-[#FEFCFB] shadow-[var(--shadow-soft-sm)] transition-shadow hover:shadow-[var(--shadow-soft-md)]"
          >
            <div
              className={`flex items-center justify-center bg-gradient-to-br ${it.bg} ${it.height} ${
                it.big ? "px-4" : ""
              }`}
            >
              {it.big ? (
                <p className="font-display text-center text-[14.5px] leading-6 text-[#5C4B45]">
                  {it.content}
                </p>
              ) : (
                <it.icon className={`size-8 opacity-70`} strokeWidth={1.5} />
              )}
            </div>
            <div className="flex items-center justify-between p-3">
              <span
                className={`rounded-full px-2 py-[3px] text-[11px] leading-none ${it.tagClass}`}
              >
                {it.type}
              </span>
              {!it.big && (
                <span className="text-[12px] text-[#7A6A63]">
                  {it.content}
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
