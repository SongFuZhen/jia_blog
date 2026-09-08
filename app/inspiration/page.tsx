"use client";

import { useEffect, useState } from "react";
import { Camera, Image as ImageIcon, Music, Plus, Quote, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Loading } from "@/components/loading";
import { useInspirationStore } from "@/lib/stores/inspiration";
import { useConfirm } from "@/lib/stores/confirm";
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
  妆容: { icon: ImageIcon, tagClass: "bg-purple-soft text-purple-ink", bg: "bg-gradient-to-br from-purple-soft to-purple-soft-2" },
  穿搭: { icon: ImageIcon, tagClass: "bg-purple-soft text-purple-ink", bg: "bg-gradient-to-br from-purple-soft to-purple-soft-2" },
  发型: { icon: ImageIcon, tagClass: "bg-blue-soft text-blue-ink", bg: "bg-gradient-to-br from-blue-soft to-blue-soft-2" },
  家居: { icon: ImageIcon, tagClass: "bg-green-soft text-green-ink", bg: "bg-gradient-to-br from-green-soft to-green-soft-2" },
  美食: { icon: Camera, tagClass: "bg-orange-soft text-orange-ink", bg: "bg-gradient-to-br from-orange-soft to-orange-soft-2" },
  摄影: { icon: ImageIcon, tagClass: "bg-pink-soft text-pink-ink", bg: "bg-gradient-to-br from-pink-soft to-pink-soft-2" },
  文案: { icon: Quote, tagClass: "bg-purple-soft text-purple-ink", bg: "bg-gradient-to-br from-purple-soft to-purple-soft-2" },
  笔记: { icon: Music, tagClass: "bg-green-soft text-green-ink", bg: "bg-gradient-to-br from-pink-soft to-pink-soft-2" },
};

export default function InspirationPage() {
  const { items, hydrated, hydrate, add, remove } = useInspirationStore();
  const confirm = useConfirm();
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
                : "bg-white text-ink-3 dark:bg-[#2B2225] shadow-[var(--shadow-xs)] hover:text-[#F16D88]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 添加 */}
      <div className="mt-3">
        {showAdd ? (
          <div className="space-y-2 rounded-[16px] bg-card p-4 shadow-[var(--shadow-soft-sm)]">
            <div className="flex flex-wrap gap-1.5">
              {filters.filter((f) => f !== "全部").map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, type: t as InspirationType })}
                  className={`rounded-full px-2.5 py-1 text-[11.5px] transition-colors ${
                    form.type === t
                      ? "bg-pink-soft font-medium text-[#E0697E]"
                      : "bg-cream text-ink-3"
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
              className="w-full resize-none rounded-[12px] bg-field px-3 py-2.5 text-[13px] outline-none"
            />
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="标签，空格分隔：眼妆 穿搭"
              className="w-full rounded-[12px] bg-field px-3 py-2.5 text-[13px] outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="rounded-full bg-cream px-3.5 py-1.5 text-[12.5px] text-ink-3 transition-colors hover:bg-pink-soft hover:text-[#E0697E]"
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
            className="inline-flex items-center gap-1 rounded-full bg-white px-3.5 dark:bg-[#2B2225] py-2 text-[12.5px] font-medium text-ink-3 shadow-[var(--shadow-xs)] transition-colors hover:text-[#E0697E]"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            收一条灵感
          </button>
        )}
      </div>

      {/* 瀑布流卡片 */}
      {!hydrated && <Loading />}
      {hydrated && (
      <div className="mt-4 columns-2 gap-3 [&>*]:mb-3">
        {filtered.map((it) => {
          const style = typeStyles[it.type];
          const isQuote = it.type === "文案";
          return (
            <article
              key={it.id}
              className="group break-inside-avoid overflow-hidden rounded-[16px] bg-card shadow-[var(--shadow-soft-sm)] transition-shadow hover:shadow-[var(--shadow-soft-md)]"
            >
              <div
                className={`flex items-center justify-center bg-gradient-to-br ${style.bg} ${
                  isQuote ? "px-4 py-8 min-h-[110px]" : "min-h-[90px]"
                }`}
              >
                {isQuote ? (
                  <p className="font-display text-center text-[14.5px] leading-6 text-ink-2">
                    “{it.content}”
                  </p>
                ) : (
                  <p className="px-3 text-center text-[13px] leading-relaxed text-ink-2">
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
                    <span key={t} className="text-[10.5px] text-ink-5">
                      #{t}
                    </span>
                  ))}
                  <button
                    onClick={async () => {
                      const ok = await confirm({ title: "删掉这条灵感？", confirmText: "删除", danger: true });
                      if (ok) remove(it.id);
                    }}
                    aria-label="删除"
                    className="text-ink-5 opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#E76F7B]"
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      )}

      {hydrated && filtered.length === 0 && (
        <p className="mt-8 text-center text-[13px] text-ink-4">
          这个分类下还没有收藏
        </p>
      )}
    </main>
  );
}
