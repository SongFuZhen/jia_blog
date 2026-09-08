"use client";

import { useEffect, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Loading } from "@/components/loading";
import { PageHeader } from "@/components/page-header";
import { useCopyStore } from "@/lib/stores/copy";
import type { CopyLibrary } from "@/lib/types";

export default function CopyPage() {
  const { library, hydrated, hydrate, save } = useCopyStore();
  const [draft, setDraft] = useState<CopyLibrary | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // 文案库加载完成后同步到本地草稿（渲染期同步）
  if (hydrated && draft === null) {
    setDraft(library);
  }

  if (!hydrated || draft === null) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
        <PageHeader title="文案编辑" subtitle="网站上的话，你来定" />
        <Loading />
      </main>
    );
  }

  function updateDay(index: number, value: string) {
    setDraft((d) => {
      if (!d) return d;
      const greetings = d.greetings.map((g, i) =>
        i === index
          ? { ...g, texts: value.split("\n").map((t) => t.trim()).filter(Boolean) }
          : g,
      );
      return { ...d, greetings };
    });
  }

  function updateSurprises(value: string) {
    setDraft((d) => {
      if (!d) return d;
      return {
        ...d,
        surprises: value.split("\n").map((t) => t.trim()).filter(Boolean),
      };
    });
  }

  async function handleSave() {
    await save(draft!);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <header className="flex items-center justify-between pt-9">
        <PageHeader title="文案编辑" subtitle="网站上的话，你来定" />
      </header>

      {/* 保存按钮 */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#E96882] px-4 py-2 text-[12.5px] font-medium text-white shadow-[0_4px_12px_rgba(233,104,130,0.3)] transition-colors hover:bg-[#D56983]"
        >
          <Check className="size-3.5" strokeWidth={2.2} />
          {savedFlash ? "已保存 ✓" : "保存全部文案"}
        </button>
      </div>

      {/* 问候语 */}
      <section className="mt-5 rounded-[20px] bg-card p-4 shadow-[var(--shadow-soft-sm)]">
        <p className="text-[14px] font-semibold text-ink">每日问候</p>
        <p className="mt-0.5 text-[11.5px] text-ink-4">
          按星期显示在首页，每行一句，当天随机选一句
        </p>
        <div className="mt-3 space-y-3">
          {draft.greetings.map((day, i) => (
            <div key={day.label}>
              <p className="text-[12.5px] font-semibold text-ink-2">{day.label}</p>
              <textarea
                value={day.texts.join("\n")}
                onChange={(e) => updateDay(i, e.target.value)}
                rows={Math.max(2, day.texts.length)}
                className="mt-1 w-full resize-none rounded-[12px] bg-field px-3 py-2.5 text-[12.5px] leading-relaxed text-ink outline-none"
              />
            </div>
          ))}
        </div>
      </section>

      {/* 今日小惊喜 */}
      <section className="mt-3 rounded-[20px] bg-card p-4 shadow-[var(--shadow-soft-sm)]">
        <p className="text-[14px] font-semibold text-ink">今日小惊喜</p>
        <p className="mt-0.5 text-[11.5px] text-ink-4">
          每天在首页随机出现一句，一行一句
        </p>
        <textarea
          value={draft.surprises.join("\n")}
          onChange={(e) => updateSurprises(e.target.value)}
          rows={Math.max(4, draft.surprises.length)}
          className="mt-2 w-full resize-none rounded-[12px] bg-field px-3 py-2.5 text-[12.5px] leading-relaxed text-ink outline-none"
        />
      </section>

      {/* 纪念日 */}
      <section className="mt-3 rounded-[20px] bg-card p-4 shadow-[var(--shadow-soft-sm)]">
        <p className="text-[14px] font-semibold text-ink">纪念日</p>
        <p className="mt-0.5 text-[11.5px] text-ink-4">
          命中日期时，首页会显示纪念日惊喜
        </p>
        <div className="mt-3 space-y-2">
          {draft.anniversaries.map((a, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={a.monthDay}
                onChange={(e) =>
                  setDraft((d) => {
                    if (!d) return d;
                    const anniversaries = d.anniversaries.map((x, xi) =>
                      xi === i ? { ...x, monthDay: e.target.value } : x,
                    );
                    return { ...d, anniversaries };
                  })
                }
                placeholder="10-07"
                maxLength={5}
                className="w-[84px] shrink-0 rounded-[10px] bg-field px-3 py-2 text-[12.5px] text-ink outline-none"
              />
              <input
                value={a.label}
                onChange={(e) =>
                  setDraft((d) => {
                    if (!d) return d;
                    const anniversaries = d.anniversaries.map((x, xi) =>
                      xi === i ? { ...x, label: e.target.value } : x,
                    );
                    return { ...d, anniversaries };
                  })
                }
                placeholder="名称，如：在一起纪念日"
                className="min-w-0 flex-1 rounded-[10px] bg-field px-3 py-2 text-[12.5px] text-ink outline-none"
              />
              <button
                onClick={() =>
                  setDraft((d) => {
                    if (!d) return d;
                    return { ...d, anniversaries: d.anniversaries.filter((_, xi) => xi !== i) };
                  })
                }
                aria-label="删除纪念日"
                className="shrink-0 text-ink-5 hover:text-[#E76F7B]"
              >
                <X className="size-4" strokeWidth={1.8} />
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              setDraft((d) => {
                if (!d) return d;
                return {
                  ...d,
                  anniversaries: [...d.anniversaries, { monthDay: "", label: "" }],
                };
              })
            }
            className="inline-flex items-center gap-1 rounded-full bg-field px-3 py-1.5 text-[11.5px] text-ink-3 transition-colors hover:bg-pink-soft hover:text-[#E0697E]"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            加一个纪念日
          </button>
        </div>
      </section>
    </main>
  );
}
