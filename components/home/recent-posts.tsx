import { Bookmark, ChevronRight, Heart, MoreHorizontal } from "lucide-react";
import Image from "next/image";

type TagTone = "pink" | "purple" | "orange" | "green" | "blue";

const toneClasses: Record<TagTone, string> = {
  pink: "bg-[#FEF0EE] text-[#D95570]",
  purple: "bg-[#F2E9FE] text-[#8B5FD6]",
  orange: "bg-[#FEF4EC] text-[#E07A3F]",
  green: "bg-[#E9F3EC] text-[#4E9A6E]",
  blue: "bg-[#E4F1FB] text-[#4E96DB]",
};

const posts = [
  {
    title: "我的日常妆容分享｜适合新手的温柔妆",
    desc: "简单几步就能出门，适合日常通勤～",
    image: "/images/post-1.png",
    tags: [
      { label: "化妆技巧", tone: "purple" as TagTone },
      { label: "日常", tone: "pink" as TagTone },
      { label: "新手", tone: "pink" as TagTone },
    ],
    date: "2025-08-30",
    likes: 382,
  },
  {
    title: "一些让生活变开心的小事",
    desc: "收集日常的小确幸，把平凡的日子过得闪闪发光 ✨",
    image: "/images/post-2.png",
    tags: [
      { label: "生活", tone: "pink" as TagTone },
      { label: "随想", tone: "purple" as TagTone },
      { label: "治愈", tone: "green" as TagTone },
    ],
    date: "2025-08-28",
    likes: 256,
  },
  {
    title: "近期爱用好物｜回购清单",
    desc: "真实自用分享，干皮友好，温和不踩雷～",
    image: "/images/post-3.png",
    tags: [
      { label: "好物推荐", tone: "orange" as TagTone },
      { label: "护肤", tone: "purple" as TagTone },
      { label: "种草", tone: "blue" as TagTone },
    ],
    date: "2025-08-26",
    likes: 421,
  },
];

export function RecentPosts() {
  return (
    <section className="mt-5 px-6">
      {/* 标题行 */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <h2 className="text-[17px] font-bold text-[#2F2528]">最近更新</h2>
          {/* 粉色笔刷下划线 */}
          <svg
            className="absolute -bottom-1 left-0 h-[5px] w-[52px]"
            viewBox="0 0 52 5"
            fill="none"
          >
            <path
              d="M2 3.5C12 1.5 34 1 50 2.5"
              stroke="#E8798F"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <a
          href="/diary"
          className="inline-flex items-center gap-0.5 text-[12.5px] text-[#6B5B55] transition-colors hover:text-primary"
        >
          查看全部
          <ChevronRight className="size-3.5" strokeWidth={1.8} />
        </a>
      </div>

      {/* 帖子列表 */}
      <div className="mt-4 space-y-3">
        {posts.map((post) => (
          <article
            key={post.title}
            className="rounded-[16px] bg-[#FEFCFB] p-3 shadow-[var(--shadow-soft-sm)] transition-shadow hover:shadow-[var(--shadow-soft-md)]"
          >
            <div className="flex gap-3">
              {/* 封面 */}
              <Image
                src={post.image}
                alt={post.title}
                width={176}
                height={134}
                className="h-[68px] w-[84px] shrink-0 rounded-[12px] object-cover"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[15px] leading-snug font-semibold text-[#2E2422]">
                    {post.title}
                  </h3>
                  <MoreHorizontal className="mt-0.5 size-4 shrink-0 text-[#C9B8B2]" />
                </div>
                <p className="mt-1 truncate text-[12px] text-[#7A6A63]">
                  {post.desc}
                </p>

                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <span
                      key={tag.label}
                      className={`rounded-full px-2.5 py-[3px] text-[11px] leading-none ${toneClasses[tag.tone]}`}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 底部：日期 + 互动 */}
            <div className="mt-2 flex items-center justify-end">
              <span className="mr-auto text-[11px] text-[#A08D85]">
                {post.date}
              </span>
              <span className="inline-flex items-center gap-1 text-[12.5px] text-[#6B5F58]">
                <Heart className="size-[15px]" strokeWidth={1.8} />
                {post.likes}
              </span>
              <Bookmark className="ml-3 size-[15px] text-[#6B5F58]" strokeWidth={1.8} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
