"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Minus,
  Pencil,
  Plus,
  Repeat,
  Sparkles,
  Star,
} from "lucide-react";
import { Loading } from "@/components/loading";
import { PageHeader } from "@/components/page-header";
import { useGrowthStore } from "@/lib/stores/growth";
import { useConfirm } from "@/lib/stores/confirm";
import { useRecordsStore } from "@/lib/stores/records";
import { todayLocal } from "@/lib/time";
import type { GrowthItem } from "@/lib/types";

export default function GrowthPage() {
  const sections = useGrowthStore((s) => s.sections);
  const hydrated = useGrowthStore((s) => s.hydrated);
  const hydrate = useGrowthStore((s) => s.hydrate);
  const toggle = useGrowthStore((s) => s.toggle);
  const addItem = useGrowthStore((s) => s.addItem);
  const updateItem = useGrowthStore((s) => s.updateItem);
  const removeItem = useGrowthStore((s) => s.removeItem);
  const moveItem = useGrowthStore((s) => s.moveItem);
  const confirm = useConfirm();

  const records = useRecordsStore((s) => s.records);
  const hydrateRecords = useRecordsStore((s) => s.hydrate);

  const [addingSection, setAddingSection] = useState<string | null>(null);
  const [newText, setNewText] = useState("");
  const [newRepeat, setNewRepeat] = useState(false);
  // 编辑模式（Microsoft To Do 风格）：进入后只能改/删/排序，不能勾选完成
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // 编辑单项
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editRepeat, setEditRepeat] = useState(false);
  const [editDue, setEditDue] = useState("");

  const today = todayLocal();

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

  const { total, done, cycleDone } = useMemo(() => {
    const all = sections.flatMap((s) => s.items);
    return {
      total: all.length,
      done: all.filter((i) => i.done).length,
      cycleDone: all.filter((i) => i.repeat && i.done).length,
    };
  }, [sections]);

  async function handleAdd(sectionTitle: string) {
    if (!newText.trim()) return;
    await addItem(sectionTitle, newText.trim(), newRepeat);
    setNewText("");
    setNewRepeat(false);
    setAddingSection(null);
  }

  function startEditItem(sTitle: string, item: GrowthItem) {
    setEditingId(item.id);
    setEditText(item.text);
    setEditRepeat(!!item.repeat);
    setEditDue(item.due ?? "");
  }

  async function saveEditItem(sTitle: string) {
    if (!editingId || !editText.trim()) return;
    await updateItem(sTitle, editingId, {
      text: editText.trim(),
      repeat: editRepeat,
      due: editDue || undefined,
    });
    setEditingId(null);
  }

  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <PageHeader title="慢慢变好" subtitle="慢慢来，都会实现的" />

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
        {cycleDone > 0 && (
          <p className="mt-2 flex items-center gap-1 text-[11.5px] text-[#D56983]">
            <Repeat className="size-3.5" strokeWidth={2} />
            循环任务已完成 {cycleDone} 次
          </p>
        )}
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
              <div className="flex items-center justify-between gap-2">
                <h2 className={`text-[15px] font-bold ${section.tone}`}>
                  {section.title}
                </h2>
                <button
                  onClick={() => {
                    setEditingSection((cur) => (cur === section.title ? null : section.title));
                    setEditingId(null);
                  }}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] active:opacity-60 ${
                    editingSection === section.title
                      ? "bg-pink-soft font-medium text-[#E0697E]"
                      : "bg-cream text-ink-3"
                  }`}
                >
                  {editingSection === section.title ? (
                    <>
                      <Check className="size-3.5" strokeWidth={2.2} />
                      完成
                    </>
                  ) : (
                    <>
                      <Pencil className="size-3.5" strokeWidth={2} />
                      编辑
                    </>
                  )}
                </button>
              </div>
              <ul className="mt-2.5 space-y-1">
                {section.items.map((item, idx) => {
                  const overdue = item.due && !item.done && item.due < today;
                  if (editingId === item.id) {
                    return (
                      <li key={item.id} className="rounded-xl bg-field/70 p-2.5">
                        <input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === "Enter") await saveEditItem(section.title);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                          className="w-full rounded-[10px] bg-card px-3 py-2 text-[13px] text-ink outline-none"
                        />
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditRepeat((v) => !v)}
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11.5px] transition-colors ${
                              editRepeat
                                ? "bg-[#E96882] text-white"
                                : "bg-card text-ink-3"
                            }`}
                          >
                            <Repeat className="size-3.5" strokeWidth={2} />
                            循环
                          </button>
                          <input
                            type="date"
                            value={editDue}
                            onChange={(e) => setEditDue(e.target.value)}
                            className="rounded-[10px] bg-card px-3 py-1.5 text-[11.5px] text-ink outline-none"
                          />
                          <span className="flex-1" />
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-full bg-cream px-3 py-1.5 text-[11.5px] text-ink-3"
                          >
                            取消
                          </button>
                          <button
                            onClick={() => saveEditItem(section.title)}
                            disabled={!editText.trim()}
                            className="rounded-full bg-[#E96882] px-3.5 py-1.5 text-[11.5px] font-medium text-white disabled:opacity-40"
                          >
                            保存
                          </button>
                        </div>
                      </li>
                    );
                  }
                  // 编辑模式：左侧删除、点文字改内容、右侧排序，不触发完成
                  if (editingSection === section.title) {
                    return (
                      <li
                        key={item.id}
                        className="flex items-center gap-2 rounded-xl px-1.5 py-2"
                      >
                        <button
                          onClick={async () => {
                            const ok = await confirm({
                              title: "删掉这件小事？",
                              confirmText: "删除",
                              danger: true,
                            });
                            if (ok) removeItem(section.title, item.id);
                          }}
                          aria-label="删除"
                          className="flex size-5 shrink-0 items-center justify-center rounded-full border border-[#E5484D] text-[#E5484D] active:opacity-60"
                        >
                          <Minus className="size-3" strokeWidth={3} />
                        </button>
                        <button
                          onClick={() => startEditItem(section.title, item)}
                          className="flex min-w-0 flex-1 items-center gap-1.5 text-left active:opacity-60"
                        >
                          <span
                            className={`truncate text-[14px] ${
                              item.done ? "text-ink-5 line-through" : "text-ink"
                            }`}
                          >
                            {item.text}
                          </span>
                          {item.repeat && (
                            <Repeat
                              className="size-3.5 shrink-0 text-[#E08AA0]"
                              strokeWidth={2}
                            />
                          )}
                          {item.due && (
                            <span className="shrink-0 text-[11px] text-ink-4">
                              {item.due.slice(5)}
                            </span>
                          )}
                        </button>
                        <div className="flex shrink-0 flex-col">
                          <button
                            onClick={() => moveItem(section.title, item.id, -1)}
                            disabled={idx === 0}
                            aria-label="上移"
                            className="text-ink-5 active:opacity-60 disabled:opacity-25"
                          >
                            <ChevronUp className="size-3.5" strokeWidth={2.2} />
                          </button>
                          <button
                            onClick={() => moveItem(section.title, item.id, 1)}
                            disabled={idx === section.items.length - 1}
                            aria-label="下移"
                            className="text-ink-5 active:opacity-60 disabled:opacity-25"
                          >
                            <ChevronDown className="size-3.5" strokeWidth={2.2} />
                          </button>
                        </div>
                      </li>
                    );
                  }
                  return (
                  <li key={item.id}>
                    <button
                      onClick={() => toggle(section.title, item.id)}
                      className="flex w-full items-center gap-3 rounded-xl px-1.5 py-2 text-left"
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
                      <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
                        <span
                          className={`text-[14px] ${
                            item.done ? "text-ink-5 line-through" : "text-ink"
                          }`}
                        >
                          {item.text}
                        </span>
                        {item.repeat && (
                          <span className="inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[11px] text-[#E08AA0]">
                            <Repeat className="size-3.5" strokeWidth={2} />
                            {!item.done && (item.cycleCount ?? 0) > 0
                              ? `已循环 ${item.cycleCount} 次`
                              : null}
                          </span>
                        )}
                        {item.due && (
                          <span
                            className={`inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap text-[11px] ${
                              overdue ? "text-[#E5484D]" : "text-ink-4"
                            }`}
                          >
                            <CalendarDays className="size-3.5" strokeWidth={2} />
                            {item.due.slice(5)}
                            {overdue ? " · 逾期" : ""}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                  );
                })}
              </ul>

              {/* 手动添加 */}
              {addingSection === section.title ? (
                <div className="mt-2 space-y-2">
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
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNewRepeat((v) => !v)}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11.5px] transition-colors ${
                        newRepeat
                          ? "bg-[#E96882] text-white"
                          : "bg-field text-ink-3"
                      }`}
                    >
                      <Repeat className="size-3.5" strokeWidth={2} />
                      循环
                    </button>
                    <button
                      onClick={() => handleAdd(section.title)}
                      disabled={!newText.trim()}
                      className="shrink-0 rounded-full bg-[#E96882] px-3.5 py-1.5 text-[12px] font-medium text-white disabled:opacity-40"
                    >
                      收下
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAddingSection(section.title);
                    setNewText("");
                    setNewRepeat(false);
                  }}
                  className="mt-2 inline-flex items-center gap-1 rounded-full bg-field px-3 py-1.5 text-[11.5px] text-ink-3 transition-colors"
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
