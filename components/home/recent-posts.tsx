"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { useRecordsStore } from "@/lib/stores/records";

export function RecentPosts() {
  const records = useRecordsStore((s) => s.records);
  const hydrate = useRecordsStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const posts = records.filter((r) => !r.draft).slice(0, 3);

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
        <Link
          href="/diary"
          className="inline-flex items-center gap-0.5 text-[12.5px] text-[#6B5B55] transition-colors hover:text-primary"
        >
          查看全部
          <ChevronRight className="size-3.5" strokeWidth={1.8} />
        </Link>
      </div>

      {/* 帖子列表（读真实记录） */}
      {posts.length === 0 ? (
        <div className="mt-4 rounded-[16px] bg-[#FEFCFB] p-6 text-center shadow-[var(--shadow-soft-sm)]">
          <p className="text-[13px] text-[#A8928B]">
            还没有记录，点下面的 ＋ 写下第一条吧
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/record/${post.id}`}
              className="block rounded-[16px] bg-[#FEFCFB] p-3 shadow-[var(--shadow-soft-sm)] transition-shadow hover:shadow-[var(--shadow-soft-md)]"
            >
              <div className="flex gap-3">
                {/* 封面 */}
                {post.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.images[0]}
                    alt={post.title}
                    className="h-[68px] w-[84px] shrink-0 rounded-[12px] object-cover"
                  />
                ) : (
                  <div className="flex h-[68px] w-[84px] shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#FFE4EA] to-[#FFD3DE] text-[20px]">
                    {post.type === "idea" ? "💭" : "📔"}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-[15px] leading-snug font-semibold text-[#2E2422]">
                      {post.title}
                    </h3>
                    <MoreHorizontal className="mt-0.5 size-4 shrink-0 text-[#C9B8B2]" />
                  </div>
                  <p className="mt-1 truncate text-[12px] text-[#7A6A63]">
                    {post.content}
                  </p>

                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-[#FEF0EE] px-2.5 py-[3px] text-[11px] leading-none text-[#D95570]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 底部：日期 + 心情 */}
              <div className="mt-2 flex items-center justify-end">
                <span className="mr-auto text-[11px] text-[#A08D85]">
                  {post.createdAt.slice(0, 10)}
                </span>
                {post.mood && (
                  <span className="rounded-full bg-[#FDECEC] px-2 py-[2px] text-[11px] text-[#D95570]">
                    {post.mood}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
