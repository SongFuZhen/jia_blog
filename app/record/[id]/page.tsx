"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  Sparkles,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { useRecordsStore } from "@/lib/stores/records";
import { generateXhsContent } from "@/lib/xiaohongshu";
import { aiGenerateXhs, aiPolishDiary } from "@/app/actions";
import type { Mood } from "@/lib/types";

const moods: Mood[] = [
  "开心",
  "幸福",
  "平静",
  "委屈",
  "难过",
  "生气",
  "好困",
  "有成就感",
];

export default function RecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const records = useRecordsStore((s) => s.records);
  const hydrate = useRecordsStore((s) => s.hydrate);
  const updateRecord = useRecordsStore((s) => s.updateRecord);
  const removeRecord = useRecordsStore((s) => s.removeRecord);

  const [editing, setEditing] = useState(false);
  const [showXhs, setShowXhs] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState<{
    title: string;
    content: string;
    mood: Mood | null;
    tags: string;
  } | null>(null);

  // AI 状态（override 绑定记录 id，切换记录时自然失效）
  const [xhsOverride, setXhsOverride] = useState<{
    id: string;
    text: string;
  } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const record = records.find((r) => r.id === id);

  if (!record) {
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
          {records.length === 0 ? "加载中…" : "这条记录不见啦"}
        </p>
      </main>
    );
  }

  function startEdit() {
    if (!record) return;
    setForm({
      title: record.title,
      content: record.content,
      mood: record.mood,
      tags: record.tags.join(" "),
    });
    setEditing(true);
  }

  async function saveEdit() {
    if (!record || !form) return;
    await updateRecord(record.id, {
      title: form.title.trim() || "无标题",
      content: form.content.trim(),
      mood: form.mood,
      tags: form.tags
        .split(/[\s,，#]+/)
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setEditing(false);
  }

  async function handleDelete() {
    if (!record) return;
    if (!window.confirm("删掉这条记录就找不回来了，确定吗？")) return;
    await removeRecord(record.id);
    router.push("/diary");
  }

  /** AI 润色：整理日记（编辑模式下改写表单内容，保存与否由用户决定） */
  async function handlePolish() {
    if (!record || !form || aiBusy) return;
    setAiBusy(true);
    setAiError(null);
    try {
      const result = await aiPolishDiary({
        title: form.title,
        content: form.content,
        mood: form.mood,
        tags: form.tags
          .split(/[\s,，#]+/)
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setForm({ ...form, title: result.title, content: result.content });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI 润色失败了");
    } finally {
      setAiBusy(false);
    }
  }

  /** AI 生成小红书文案；失败回退模板版 */
  async function handleAiXhs() {
    if (!record || aiBusy) return;
    setAiBusy(true);
    setAiError(null);
    try {
      const text = await aiGenerateXhs({
        title: record.title,
        content: record.content,
        mood: record.mood,
        tags: record.tags,
      });
      setXhsOverride({ id: record.id, text });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI 生成失败了");
    } finally {
      setAiBusy(false);
    }
  }

  const templateText = record ? generateXhsContent(record) : "";
  const xhsText =
    xhsOverride && record && xhsOverride.id === record.id
      ? xhsOverride.text
      : templateText;
  const isAiText = Boolean(xhsOverride && record && xhsOverride.id === record.id);

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
        <div className="flex items-center gap-2">
          {!editing && (
            <>
              <button
                onClick={() => setShowXhs((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 dark:bg-[#2B2225].5 py-2 text-[12.5px] font-medium text-ink-3 shadow-[var(--shadow-xs)] transition-colors hover:text-[#E0697E]"
              >
                <Sparkles className="size-3.5" strokeWidth={1.8} />
                小红书文案
              </button>
              <button
                onClick={startEdit}
                className="rounded-full bg-white px-3 dark:bg-[#2B2225].5 py-2 text-[12.5px] font-medium text-ink-3 shadow-[var(--shadow-xs)] transition-colors hover:text-[#E0697E]"
              >
                编辑
              </button>
            </>
          )}
          {editing && (
            <button
              onClick={saveEdit}
              className="inline-flex items-center gap-1 rounded-full bg-[#E96882] px-3.5 py-2 text-[12.5px] font-medium text-white shadow-[0_4px_12px_rgba(233,104,130,0.3)] transition-colors hover:bg-[#D56983]"
            >
              <Check className="size-3.5" strokeWidth={2} />
              保存
            </button>
          )}
        </div>
      </header>

      {/* 小红书文案面板 */}
      {showXhs && (
        <div className="mt-4 rounded-[16px] bg-orange-soft p-4 shadow-[var(--shadow-soft-sm)]">
          <p className="text-[12px] font-medium text-gold-ink">
            小红书文案（{isAiText ? "AI 生成" : "模板生成"}）
          </p>
          {aiBusy && !isAiText ? (
            <p className="mt-3 flex items-center gap-2 text-[12.5px] text-gold-ink">
              <Loader2 className="size-4 animate-spin" />
              AI 正在写，稍等一下…
            </p>
          ) : (
            <pre className="font-display mt-2 text-[12.5px] leading-relaxed whitespace-pre-wrap text-ink-2">
              {xhsText}
            </pre>
          )}
          {aiError && (
            <p className="mt-2 text-[11.5px] text-[#E76F7B]">{aiError}，先用模板版吧</p>
          )}
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              onClick={handleAiXhs}
              disabled={aiBusy}
              className="inline-flex items-center gap-1 rounded-full bg-white px-3 dark:bg-[#2B2225] py-1.5 text-[12px] font-medium text-ink-3 shadow-[var(--shadow-xs)] transition-colors hover:text-[#E0697E] disabled:opacity-50"
            >
              <WandSparkles className="size-3.5" strokeWidth={1.8} />
              {aiBusy ? "生成中…" : "AI 生成"}
            </button>
            {isAiText && (
              <button
                onClick={() => setXhsOverride(null)}
                className="rounded-full bg-white px-3 dark:bg-[#2B2225] py-1.5 text-[12px] font-medium text-ink-3 shadow-[var(--shadow-xs)] transition-colors hover:text-[#E0697E]"
              >
                看模板版
              </button>
            )}
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(xhsText);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="inline-flex items-center gap-1 rounded-full bg-white px-3 dark:bg-[#2B2225] py-1.5 text-[12px] font-medium text-ink-3 shadow-[var(--shadow-xs)] transition-colors hover:text-[#E0697E]"
            >
              <Copy className="size-3.5" strokeWidth={1.8} />
              {copied ? "复制好啦" : "复制文案"}
            </button>
          </div>
        </div>
      )}

      {/* 正文卡片 */}
      <article className="mt-4 rounded-[20px] bg-card p-5 shadow-[var(--shadow-soft-sm)]">
        {editing && form ? (
          <div className="space-y-3">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-[12px] bg-field px-3 py-2.5 text-[15px] font-medium text-ink outline-none"
            />
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={6}
              className="w-full resize-none rounded-[12px] bg-field px-3 py-2.5 text-[13.5px] leading-relaxed text-ink outline-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {moods.map((m) => (
                <button
                  key={m}
                  onClick={() => setForm({ ...form, mood: form.mood === m ? null : m })}
                  className={`rounded-full px-3 py-1.5 text-[12.5px] transition-colors ${
                    form.mood === m
                      ? "bg-pink-soft font-medium text-[#E0697E]"
                      : "bg-cream text-ink-3"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="标签，空格分隔"
              className="w-full rounded-[12px] bg-field px-3 py-2.5 text-[13px] text-ink outline-none"
            />
            {aiError && editing && (
              <p className="text-[11.5px] text-[#E76F7B]">{aiError}</p>
            )}
            <button
              onClick={handlePolish}
              disabled={aiBusy || !form.content.trim()}
              className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[12px] bg-orange-soft text-[13px] font-medium text-gold-ink transition-colors hover:bg-orange-soft disabled:opacity-50"
            >
              {aiBusy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" strokeWidth={1.8} />
              )}
              {aiBusy ? "AI 整理中…" : "AI 润色这篇日记"}
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-[19px] leading-snug font-bold text-ink">
              {record.title}
            </h1>
            <p className="mt-1.5 text-[11.5px] text-ink-4">
              {record.createdAt.slice(0, 10)}
              {record.mood && ` · ${record.mood}`}
              {record.weather && ` · ${record.weather}`}
              {record.location && ` · ${record.location}`}
              {record.draft && " · 草稿"}
            </p>
            {record.images.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {record.images.map((src, i) => {
                  const meta = record.imageMeta?.find((m) => m.url === src);
                  return (
                    <div key={i}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`照片 ${i + 1}`}
                        className="aspect-square w-full rounded-[12px] object-cover"
                      />
                      {meta && (meta.takenAt || meta.location) && (
                        <p className="mt-1 text-[10.5px] leading-tight text-ink-5">
                          {meta.takenAt &&
                            `${meta.takenAt.slice(0, 10)} ${meta.takenAt.slice(11, 16)}`}
                          {meta.takenAt && meta.location ? " · " : ""}
                          {meta.location}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <p className="mt-3 text-[13.5px] leading-relaxed whitespace-pre-wrap text-ink-2">
              {record.content}
            </p>
            {record.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {record.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-pink-soft px-2.5 py-[3px] text-[11px] text-pink-ink"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </article>

      {/* 删除 */}
      {!editing && (
        <button
          onClick={handleDelete}
          className="mx-auto mt-5 flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] text-ink-5 transition-colors hover:bg-pink-hover hover:text-[#E76F7B]"
        >
          <Trash2 className="size-3.5" strokeWidth={1.8} />
          删除这条记录
        </button>
      )}
    </main>
  );
}
