"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Sparkles, Star, X } from "lucide-react";
import { Loading } from "@/components/loading";
import { PageHeader } from "@/components/page-header";
import { useGrowthStore } from "@/lib/stores/growth";
import { useRecordsStore } from "@/lib/stores/records";

export default function GrowthPage() {
  const sections = useGrowthStore((s) => s.sections);
  const hydrated = useGrowthStore((s) => s.hydrated);
  const hydrate = useGrowthStore((s) => s.hydrate);
  const toggle = useGrowthStore((s) => s.toggle);
  const addItem = useGrowthStore((s) => s.addItem);
  const removeItem = useGrowthStore((s) => s.removeItem);

  const records = useRecordsStore((s) => s.records);
  const hydrateRecords = useRecordsStore((s) => s.hydrate);

  const [addingSection, setAddingSection] = useState<string | null>(null);
  const [newText, setNewText] = useState("");

  useEffect(() => {
    hydrate();
    hydrateRecords();
  }, [hydrate, hydrateRecords]);

  // 成长时间线：自动提取带「第一次」的记录
  const firstTimes = useMemo(
    () =>
      records
        .filter(
          (r) =>
            !r.draft &&
            (r.tags.includes("第一次") ||
              r.title.includes("第一次") ||
              r.content.includes("第一次")),
        )
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [records],
  );

  const { total, done } = useMemo(() => {
    const all = sections.flatMap((s) => s.items);
    return { total: all.length, done: all.filter((i) => i.done).length };
  }, [sections]);

  async function handleAdd(sectionTitle: string) {
    if (!newText.trim()) return;
    await addItem(sectionTitle, newText.trim());
    setNewText("");
    setAddingSection(null);
  }

  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <PageHeader title="成长清单" subtitle="慢慢来，都会实现的" />

      {/* 成长时间线 */}
      <section className="mt-5 rounded-[20px] bg-gradient-to-r from-orange-soft to-orange-soft-2 p-4 shadow-[var(--shadow-soft-sm)]">
        <p className="flex items-center gap-1.5 text-[14px] font-semibold text-gold-ink">
          <Star className="size-4 fill-[#F0A24B] text-[#F0A24B]" strokeWidth={1.8} />
          成长时间线 · 我的「第一次」
        </p>
        {firstTimes.length === 0 ? (
          <p className="mt-2 text-[12px] text-gold-ink">
            给记录加上「第一次」标签，就会自动出现在这里
          </p>
        ) : (
          <ol className="mt-3 space-y-2.5">
            {firstTimes.map((r) => (
              <li key={r.id} className="flex items-start gap-2.5">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#F0A24B]" />
                <div>
                  <p className="text-[13px] font-medium text-ink-2">{r.title}</p>
                  <p className="text-[11px] text-gold-ink">{r.createdAt.slice(0, 10)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* 总进度 */}
      <div className="mt-5 rounded-[20px] bg-gradient-to-r from-pink-soft to-pink-soft-2 p-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[14.5px] font-semibold text-ink">
            <Sparkles className="size-4 text-[#D56983]" strokeWidth={1.8} />
            已完成 {done} / {total} 件小事
          </p>
          <span className="text-[16px] font-bold text-[#D56983]">
            {percent}%
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70 dark:bg-black/30">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FFB4C3] to-[#F16D88] transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* 分区清单 */}
      <div className="mt-4 space-y-3">
        {!hydrated ? (
          <Loading />
        ) : (
          sections.map((section) => (
            <section
              key={section.title}
              className="rounded-[20px] bg-card p-4 shadow-[var(--shadow-soft-sm)]"
            >
              <h2 className={`text-[15px] font-bold ${section.tone}`}>
                {section.title}
              </h2>
              <ul className="mt-2.5 space-y-1">
                {section.items.map((item) => (
                  <li key={item.id} className="group/item relative">
                    <button
                      onClick={() => toggle(section.title, item.id)}
                      className="flex w-full items-center gap-3 rounded-xl px-1.5 py-2 text-left transition-colors hover:bg-card-hover"
                    >
                      <span
                        className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                          item.done
                            ? "border-[#F16D88] bg-[#F16D88] text-white"
                            : "border-toggle-off bg-white dark:bg-card"
                        }`}
                      >
                        {item.done && <Check className="size-3" strokeWidth={3} />}
                      </span>
                      <span
                        className={`text-[14px] ${
                          item.done ? "text-ink-5 line-through" : "text-ink"
                        }`}
                      >
                        {item.text}
                      </span>
                    </button>
                    <button
                      onClick={() => removeItem(section.title, item.id)}
                      aria-label="删除"
                      className="absolute top-2.5 right-1.5 text-ink-5 opacity-0 transition-opacity group-hover/item:opacity-100 hover:text-[#E76F7B]"
                    >
                      <X className="size-3.5" strokeWidth={1.8} />
                    </button>
                  </li>
                ))}
              </ul>

              {/* 手动添加 */}
              {addingSection === section.title ? (
                <div className="mt-2 flex gap-2">
                  <input
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") await handleAdd(section.title);
                      if (e.key === "Escape") setAddingSection(null);
                    }}
                    autoFocus
                    placeholder={`想在「${section.title}」加什么？`}
                    className="w-full rounded-[10px] bg-field px-3 py-2 text-[12.5px] text-ink outline-none"
                  />
                  <button
                    onClick={() => handleAdd(section.title)}
                    disabled={!newText.trim()}
                    className="shrink-0 rounded-full bg-[#E96882] px-3.5 py-1.5 text-[12px] font-medium text-white disabled:opacity-40"
                  >
                    收下
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAddingSection(section.title);
                    setNewText("");
                  }}
                  className="mt-2 inline-flex items-center gap-1 rounded-full bg-field px-3 py-1.5 text-[11.5px] text-ink-3 transition-colors hover:bg-pink-soft hover:text-[#E0697E]"
                >
                  <Plus className="size-3.5" strokeWidth={2} />
                  加一件小事
                </button>
              )}
            </section>
          ))
        )}
      </div>
    </main>
  );
}
