"use client";

import { useEffect, useState } from "react";
import { Check, Eye, Gift } from "lucide-react";
import { Loading } from "@/components/loading";
import { PageHeader } from "@/components/page-header";
import { useCopyStore } from "@/lib/stores/copy";
import { getGreeting, getSurprise } from "@/lib/surprises";
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

  // 实时预览：用草稿数据计算今天在首页的实际显示效果
  const greeting = getGreeting(draft, new Date());
  const surprise = getSurprise(draft, new Date());

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <header className="flex items-center justify-between pt-9">
        <PageHeader title="文案编辑" subtitle="网站上的话，你来定" />
      </header>

      {/* 实时预览（吸顶，展示今天在首页的实际效果） */}
      <div className="sticky top-2 z-20 mt-4 rounded-[20px] bg-card p-4 shadow-[var(--shadow-soft-md)]">
        <p className="mb-3 flex items-center gap-1.5 text-[11.5px] font-medium text-ink-4">
          <Eye className="size-3.5" strokeWidth={1.8} />
          实时预览 · 今天在首页的效果
        </p>
        {/* 首页问候胶囊 */}
        <div className="flex justify-end">
          <div className="rounded-full bg-cream px-3.5 py-1.5 text-[11.5px] font-medium text-ink-3 shadow-[var(--shadow-xs)]">
            {greeting.label} · {greeting.text}
          </div>
        </div>
        {/* 小惊喜卡片 */}
        <div
          className={`mt-2 flex items-center gap-3 rounded-[16px] p-3 ${
            surprise.isAnniversary
              ? "bg-gradient-to-r from-pink-soft to-pink-soft-2"
              : "bg-gradient-to-r from-orange-soft to-orange-soft-2"
          }`}
        >
          <span
            className={`flex size-8 shrink-0 items-center justify-center rounded-full text-white ${
              surprise.isAnniversary ? "bg-[#D56983]" : "bg-[#F0A24B]"
            }`}
          >
            <Gift className="size-4" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <p
              className={`text-[10.5px] font-medium ${
                surprise.isAnniversary ? "text-[#D56983]" : "text-gold-ink"
              }`}
            >
              {surprise.isAnniversary ? "纪念日快乐" : "今日小惊喜"}
            </p>
            <p className="font-display truncate text-[13px] leading-snug text-ink-2">
              {surprise.text}
            </p>
          </div>
        </div>
      </div>

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
    </main>
  );
}
