"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Copy, Sparkles, Trash2 } from "lucide-react";
import { useRecordsStore } from "@/lib/stores/records";
import { generateXhsContent } from "@/lib/xiaohongshu";
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
            className="flex size-9 items-center justify-center rounded-full bg-white text-[#8A7A72] shadow-[var(--shadow-xs)]"
          >
            <ArrowLeft className="size-4.5" strokeWidth={1.8} />
          </button>
        </header>
        <p className="mt-16 text-center text-[13.5px] text-[#A8928B]">
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

  const xhsText = record ? generateXhsContent(record) : "";

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <header className="flex items-center justify-between pt-9">
        <button
          onClick={() => router.back()}
          aria-label="返回"
          className="flex size-9 items-center justify-center rounded-full bg-white text-[#8A7A72] shadow-[var(--shadow-xs)] transition-colors hover:text-[#E0697E]"
        >
          <ArrowLeft className="size-4.5" strokeWidth={1.8} />
        </button>
        <div className="flex items-center gap-2">
          {!editing && (
            <>
              <button
                onClick={() => setShowXhs((v) => !v)}
                className="inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-2 text-[12.5px] font-medium text-[#8A7A72] shadow-[var(--shadow-xs)] transition-colors hover:text-[#E0697E]"
              >
                <Sparkles className="size-3.5" strokeWidth={1.8} />
                小红书文案
              </button>
              <button
                onClick={startEdit}
                className="rounded-full bg-white px-3.5 py-2 text-[12.5px] font-medium text-[#8A7A72] shadow-[var(--shadow-xs)] transition-colors hover:text-[#E0697E]"
              >
                编辑
              </button>
            </>
          )}
          {editing && (
            <button
              onClick={saveEdit}
              className="inline-flex items-center gap-1 rounded-full bg-[#E96882] px-3.5 py-2 text-[12.5px] font-medium text-white shadow-[0_4px_12px_rgba(233,104,130,0.3)]"
            >
              <Check className="size-3.5" strokeWidth={2} />
              保存
            </button>
          )}
        </div>
      </header>

      {/* 小红书文案面板 */}
      {showXhs && (
        <div className="mt-4 rounded-[16px] bg-[#FFF6EC] p-4 shadow-[var(--shadow-soft-sm)]">
          <p className="text-[12px] font-medium text-[#C79A6B]">
            小红书文案（已按模板生成）
          </p>
          <pre className="font-display mt-2 text-[12.5px] leading-relaxed whitespace-pre-wrap text-[#5C4B45]">
            {xhsText}
          </pre>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(xhsText);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-[#8A7A72] shadow-[var(--shadow-xs)]"
          >
            <Copy className="size-3.5" strokeWidth={1.8} />
            {copied ? "复制好啦" : "复制文案"}
          </button>
        </div>
      )}

      {/* 正文卡片 */}
      <article className="mt-4 rounded-[20px] bg-[#FEFCFB] p-5 shadow-[var(--shadow-soft-sm)]">
        {editing && form ? (
          <div className="space-y-3">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-[12px] bg-[#FAF5F2] px-3 py-2.5 text-[15px] font-medium text-[#3B2E2A] outline-none"
            />
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={6}
              className="w-full resize-none rounded-[12px] bg-[#FAF5F2] px-3 py-2.5 text-[13.5px] leading-relaxed text-[#3B2E2A] outline-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {moods.map((m) => (
                <button
                  key={m}
                  onClick={() => setForm({ ...form, mood: form.mood === m ? null : m })}
                  className={`rounded-full px-3 py-1.5 text-[12.5px] transition-colors ${
                    form.mood === m
                      ? "bg-[#FDECEC] font-medium text-[#E0697E]"
                      : "bg-[#F7F0EC] text-[#8A7A72]"
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
              className="w-full rounded-[12px] bg-[#FAF5F2] px-3 py-2.5 text-[13px] text-[#3B2E2A] outline-none"
            />
          </div>
        ) : (
          <>
            <h1 className="text-[19px] leading-snug font-bold text-[#2E2422]">
              {record.title}
            </h1>
            <p className="mt-1.5 text-[11.5px] text-[#A08D85]">
              {record.createdAt.slice(0, 10)}
              {record.mood && ` · ${record.mood}`}
              {record.weather && ` · ${record.weather}`}
              {record.location && ` · ${record.location}`}
              {record.draft && " · 草稿"}
            </p>
            {record.images.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {record.images.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt={`照片 ${i + 1}`}
                    className="aspect-square w-full rounded-[12px] object-cover"
                  />
                ))}
              </div>
            )}
            <p className="mt-3 text-[13.5px] leading-relaxed whitespace-pre-wrap text-[#4A3C37]">
              {record.content}
            </p>
            {record.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {record.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-[#FEF0EE] px-2.5 py-[3px] text-[11px] text-[#D95570]"
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
          className="mx-auto mt-5 flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] text-[#C9A9AF] transition-colors hover:bg-[#FFF0F1] hover:text-[#E76F7B]"
        >
          <Trash2 className="size-3.5" strokeWidth={1.8} />
          删除这条记录
        </button>
      )}
    </main>
  );
}
