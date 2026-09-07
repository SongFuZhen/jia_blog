"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, NotebookPen, Star } from "lucide-react";
import { useBeautyStore } from "@/lib/stores/beauty";

export default function TipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { tips, hydrate, markTried } = useBeautyStore();

  const [showTried, setShowTried] = useState(false);
  const [triedAt, setTriedAt] = useState(new Date().toISOString().slice(0, 10));
  const [effect, setEffect] = useState(4);
  const [nextAdjust, setNextAdjust] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const tip = tips.find((t) => t.id === id);

  if (!tip) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-background px-6 pb-32">
        <header className="pt-9">
          <button
            onClick={() => router.back()}
            aria-label="返回"
            className="flex size-9 items-center justify-center rounded-full bg-white text-ink-3 dark:bg-[#2B2225] shadow-[var(--shadow-xs)]"
          >
            <ArrowLeft className="size-4.5" strokeWidth={1.8} />
          </button>
        </header>
        <p className="mt-16 text-center text-[13.5px] text-ink-4">
          {tips.length === 0 ? "加载中…" : "这篇技巧不见啦"}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <header className="flex items-center justify-between pt-9">
        <button
          onClick={() => router.back()}
          aria-label="返回"
          className="flex size-9 items-center justify-center rounded-full bg-white text-ink-3 dark:bg-[#2B2225] shadow-[var(--shadow-xs)] transition-colors hover:text-[#E0697E]"
        >
          <ArrowLeft className="size-4.5" strokeWidth={1.8} />
        </button>
        {!showTried && (
          <button
            onClick={() => setShowTried(true)}
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 dark:bg-[#2B2225].5 py-2 text-[12.5px] font-medium text-ink-3 shadow-[var(--shadow-xs)] transition-colors hover:text-[#E0697E]"
          >
            <NotebookPen className="size-3.5" strokeWidth={1.8} />
            我试过了
          </button>
        )}
      </header>

      <article className="mt-4 rounded-[20px] bg-card p-5 shadow-[var(--shadow-soft-sm)]">
        <h1 className="text-[19px] font-bold text-ink">{tip.title}</h1>
        <p className="mt-1.5 text-[11.5px] text-ink-4">
          {tip.category}
          {tip.scene && ` · 适合${tip.scene}`}
          {" · "}
          <span className="inline-flex items-center gap-0.5">
            {tip.rating} 分
            <Star className="size-3 fill-[#FFC46B] text-[#FFC46B]" />
          </span>
        </p>

        {tip.steps.length > 0 && (
          <>
            <h2 className="mt-4 text-[14px] font-semibold text-ink">步骤</h2>
            <ol className="mt-2 space-y-1.5">
              {tip.steps.map((s, i) => (
                <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-pink-soft text-[11px] font-bold text-[#E0697E]">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </>
        )}

        {tip.products.length > 0 && (
          <>
            <h2 className="mt-4 text-[14px] font-semibold text-ink">用到的东西</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tip.products.map((p) => (
                <span
                  key={p}
                  className="rounded-full bg-purple-soft px-2.5 py-[3px] text-[11.5px] text-purple-ink"
                >
                  {p}
                </span>
              ))}
            </div>
          </>
        )}

        {tip.notes && (
          <>
            <h2 className="mt-4 text-[14px] font-semibold text-ink">注意事项</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{tip.notes}</p>
          </>
        )}
      </article>

      {/* 「我试过了」记录 */}
      {tip.triedAt && !showTried && (
        <div className="mt-3 rounded-[16px] bg-green-soft p-4">
          <p className="text-[13px] font-semibold text-green-ink">
            <Check className="mr-1 inline size-4" strokeWidth={2.4} />
            {tip.triedAt.slice(0, 10)} 试过了 · 效果 {tip.triedEffect ?? "—"} 分
          </p>
          {tip.nextAdjust && (
            <p className="mt-1 text-[12px] text-green-ink">
              下次想调整：{tip.nextAdjust}
            </p>
          )}
        </div>
      )}

      {showTried && (
        <div className="mt-3 rounded-[16px] bg-card p-4 shadow-[var(--shadow-soft-sm)]">
          <p className="text-[13.5px] font-semibold text-ink">记录这次尝试</p>
          <div className="mt-2.5 flex items-center gap-3">
            <input
              type="date"
              value={triedAt}
              onChange={(e) => setTriedAt(e.target.value)}
              className="rounded-[10px] bg-field px-3 py-2 text-[12.5px] text-ink outline-none"
            />
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setEffect(n)}>
                  <Star
                    className={`size-5 ${
                      n <= effect ? "fill-[#FFC46B] text-[#FFC46B]" : "text-toggle-off"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <input
            value={nextAdjust}
            onChange={(e) => setNextAdjust(e.target.value)}
            placeholder="下次想调整的点（选填）：比如眼影再淡一点"
            className="mt-2.5 w-full rounded-[12px] bg-field px-3 py-2.5 text-[13px] outline-none"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setShowTried(false)}
              className="rounded-full bg-cream px-3.5 py-1.5 text-[12.5px] text-ink-3 transition-colors hover:bg-pink-soft hover:text-[#E0697E]"
            >
              取消
            </button>
            <button
              onClick={async () => {
                await markTried(tip.id, { triedAt, triedEffect: effect, nextAdjust: nextAdjust.trim() || undefined });
                setSaved(true);
                setShowTried(false);
                setTimeout(() => setSaved(false), 1500);
              }}
              className="rounded-full bg-[#E96882] px-3.5 py-1.5 text-[12.5px] font-medium text-white shadow-[0_4px_12px_rgba(233,104,130,0.3)] transition-colors hover:bg-[#D56983]"
            >
              {saved ? "记好啦 ✓" : "记下来"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
