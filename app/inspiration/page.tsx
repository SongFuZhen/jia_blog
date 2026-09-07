"use client";

import { useEffect, useState } from "react";
import { Camera, Image as ImageIcon, Music, Plus, Quote, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useInspirationStore } from "@/lib/stores/inspiration";
import type { InspirationType } from "@/lib/types";

const filters: (InspirationType | "全部")[] = [
  "全部",
  "妆容",
  "穿搭",
  "发型",
  "家居",
  "美食",
  "摄影",
  "文案",
  "笔记",
];

const typeStyles: Record<InspirationType, { icon: typeof Quote; tagClass: string; bg: string }> = {
  妆容: { icon: ImageIcon, tagClass: "bg-[#F2E9FE] text-[#8B5FD6]", bg: "bg-gradient-to-br from-[#F6E7FB] to-[#EFE0FC]" },
  穿搭: { icon: ImageIcon, tagClass: "bg-[#F2E9FE] text-[#8B5FD6]", bg: "bg-gradient-to-br from-[#EFE0FC] to-[#F6E7FB]" },
  发型: { icon: ImageIcon, tagClass: "bg-[#E4F1FB] text-[#4E96DB]", bg: "bg-gradient-to-br from-[#E4F1FB] to-[#D5E9F9]" },
  家居: { icon: ImageIcon, tagClass: "bg-[#E9F3EC] text-[#4E9A6E]", bg: "bg-gradient-to-br from-[#E7F3EB] to-[#D5EBDE]" },
  美食: { icon: Camera, tagClass: "bg-[#FEF4EC] text-[#E07A3F]", bg: "bg-gradient-to-br from-[#FDEFE0] to-[#FBE4CC]" },
  摄影: { icon: ImageIcon, tagClass: "bg-[#FEF0EE] text-[#D95570]", bg: "bg-gradient-to-br from-[#FFE4EA] to-[#FFD3DE]" },
  文案: { icon: Quote, tagClass: "bg-[#F2E9FE] text-[#8B5FD6]", bg: "bg-gradient-to-br from-[#F6E7FB] to-[#EFE0FC]" },
  笔记: { icon: Music, tagClass: "bg-[#E9F3EC] text-[#4E9A6E]", bg: "bg-gradient-to-br from-[#FFE9EE] to-[#FFDCE5]" },
};

export default function InspirationPage() {
  const { items, hydrate, add, remove } = useInspirationStore();
  const [filter, setFilter] = useState<InspirationType | "全部">("全部");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<{ type: InspirationType; content: string; tags: string }>({
    type: "文案",
    content: "",
    tags: "",
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const filtered = filter === "全部" ? items : items.filter((i) => i.type === filter);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <PageHeader title="灵感收藏" subtitle="喜欢的都装进小口袋" />

      {/* 筛选 */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
              filter === f
                ? "bg-[#F16D88] text-white"
                : "bg-white text-[#8A7A72] shadow-[var(--shadow-xs)] hover:text-[#F16D88]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 添加 */}
      <div className="mt-3">
        {showAdd ? (
          <div className="space-y-2 rounded-[16px] bg-[#FEFCFB] p-4 shadow-[var(--shadow-soft-sm)]">
            <div className="flex flex-wrap gap-1.5">
              {filters.filter((f) => f !== "全部").map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, type: t as InspirationType })}
                  className={`rounded-full px-2.5 py-1 text-[11.5px] transition-colors ${
                    form.type === t
                      ? "bg-[#FDECEC] font-medium text-[#E0697E]"
                      : "bg-[#F7F0EC] text-[#8A7A72]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={2}
              placeholder="记下这句文案 / 这个瞬间…"
              className="w-full resize-none rounded-[12px] bg-[#FAF5F2] px-3 py-2.5 text-[13px] outline-none"
            />
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="标签，空格分隔：眼妆 穿搭"
              className="w-full rounded-[12px] bg-[#FAF5F2] px-3 py-2.5 text-[13px] outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="rounded-full bg-[#F7F0EC] px-3.5 py-1.5 text-[12.5px] text-[#8A7A72] transition-colors hover:bg-[#FDECEC] hover:text-[#E0697E]"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  if (!form.content.trim()) return;
                  await add({
                    type: form.type,
                    content: form.content.trim(),
                    tags: form.tags.split(/[\s,，]+/).map((t) => t.trim()).filter(Boolean),
                    createdAt: new Date().toISOString(),
                  });
                  setForm({ type: "文案", content: "", tags: "" });
                  setShowAdd(false);
                }}
                disabled={!form.content.trim()}
                className="rounded-full bg-[#E96882] px-3.5 py-1.5 text-[12.5px] font-medium text-white shadow-[0_4px_12px_rgba(233,104,130,0.3)] transition-colors hover:bg-[#D56983] disabled:opacity-40"
              >
                收进口袋
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-2 text-[12.5px] font-medium text-[#8A7A72] shadow-[var(--shadow-xs)] transition-colors hover:text-[#E0697E]"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            收一条灵感
          </button>
        )}
      </div>

      {/* 瀑布流卡片 */}
      <div className="mt-4 columns-2 gap-3 [&>*]:mb-3">
        {filtered.map((it) => {
          const style = typeStyles[it.type];
          const isQuote = it.type === "文案";
          return (
            <article
              key={it.id}
              className="group break-inside-avoid overflow-hidden rounded-[16px] bg-[#FEFCFB] shadow-[var(--shadow-soft-sm)] transition-shadow hover:shadow-[var(--shadow-soft-md)]"
            >
              <div
                className={`flex items-center justify-center bg-gradient-to-br ${style.bg} ${
                  isQuote ? "px-4 py-8 min-h-[110px]" : "min-h-[90px]"
                }`}
              >
                {isQuote ? (
                  <p className="font-display text-center text-[14.5px] leading-6 text-[#5C4B45]">
                    “{it.content}”
                  </p>
                ) : (
                  <p className="px-3 text-center text-[13px] leading-relaxed text-[#5C4B45]">
                    {it.content}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between p-3">
                <span
                  className={`rounded-full px-2 py-[3px] text-[11px] leading-none ${style.tagClass}`}
                >
                  {it.type}
                </span>
                <div className="flex items-center gap-2">
                  {it.tags.slice(0, 1).map((t) => (
                    <span key={t} className="text-[10.5px] text-[#C0ABA3]">
                      #{t}
                    </span>
                  ))}
                  <button
                    onClick={() => remove(it.id)}
                    aria-label="删除"
                    className="text-[#E3CBCF] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#E76F7B]"
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-[13px] text-[#A8928B]">
          这个分类下还没有收藏
        </p>
      )}
    </main>
  );
}
