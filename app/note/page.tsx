"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Mic, NotebookPen } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useRecordsStore } from "@/lib/stores/records";
import { XfyunIat } from "@/lib/xfyun-speech";
import { nowLocalISO } from "@/lib/time";

export default function NotePage() {
  const records = useRecordsStore((s) => s.records);
  const hydrate = useRecordsStore((s) => s.hydrate);
  const addRecord = useRecordsStore((s) => s.addRecord);

  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speechHint, setSpeechHint] = useState("");
  const iatRef = useRef<XfyunIat | null>(null);

  useEffect(() => {
    hydrate();
    return () => iatRef.current?.stop();
  }, [hydrate]);

  const recent = useMemo(
    () =>
      records
        .filter((r) => r.draft && r.type === "idea")
        .slice(0, 3)
        .map((r) => ({ id: r.id, content: r.content, createdAt: r.createdAt })),
    [records],
  );

  async function save() {
    const content = text.trim();
    if (!content || busy) return;
    setBusy(true);
    try {
      await addRecord({
        type: "idea",
        title: content.slice(0, 20) || "随手记",
        content,
        images: [],
        mood: null,
        tags: [],
        visibility: "仅自己",
        draft: true,
        createdAt: nowLocalISO(),
      });
      setText("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
    } finally {
      setBusy(false);
    }
  }

  function toggleMic() {
    if (recording) {
      iatRef.current?.stop();
      return;
    }
    const appId = process.env.NEXT_PUBLIC_XFYUN_APPID;
    const apiKey = process.env.NEXT_PUBLIC_XFYUN_API_KEY;
    const apiSecret = process.env.NEXT_PUBLIC_XFYUN_API_SECRET;
    if (!appId || !apiKey || !apiSecret) {
      setSpeechHint("还没配置讯飞密钥");
      return;
    }
    const iat = new XfyunIat(appId, apiKey, apiSecret);
    iatRef.current = iat;
    setSpeechHint("");
    iat.start({
      onState: (r) => setRecording(r),
      onResult: (t) => setText(t),
      onError: (msg) => {
        setSpeechHint(msg);
        setRecording(false);
      },
    });
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <PageHeader title="随便记" subtitle="想到什么就先记下来" />

      <div className="mt-4 rounded-[20px] bg-card p-4 shadow-[var(--shadow-soft-sm)]">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
          }}
          placeholder="想到什么就写下来，或点右边麦克风说一句"
          className="min-h-[160px] w-full resize-none bg-transparent text-[15px] leading-relaxed text-ink outline-none placeholder:text-ink-5"
        />
        <div className="mt-3 flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={toggleMic}
            aria-label="语音输入"
            className={`flex size-16 items-center justify-center rounded-full transition-colors active:opacity-60 ${
              recording ? "bg-[#E0697E] text-white" : "bg-cream text-ink-3"
            }`}
          >
            <Mic className="size-7" strokeWidth={2} />
          </button>
          <span className="text-[11px] text-ink-4">
            {recording ? "正在听…点一下停止" : "点一下说话"}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border-soft pt-3">
          <span className="flex min-w-0 items-center gap-1 text-[11.5px] text-ink-4">
            {speechHint ? (
              <span className="truncate text-[#E5484D]">{speechHint}</span>
            ) : saved ? (
              <>
                <Check className="size-3.5 text-[#4E9A6E]" strokeWidth={2.4} />
                已存到草稿箱
              </>
            ) : (
              `${text.trim().length} 字`
            )}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/drafts"
              className="rounded-full bg-cream px-3 py-2 text-[11.5px] text-ink-3 active:opacity-60"
            >
              去草稿箱
            </Link>
            <button
              onClick={save}
              disabled={!text.trim() || busy}
              className="rounded-full bg-[#E96882] px-4 py-2 text-[12.5px] font-medium text-white disabled:opacity-40"
            >
              存起来
            </button>
          </div>
        </div>
      </div>

      {recent.length > 0 && (
        <section className="mt-5">
          <h2 className="flex items-center gap-1.5 px-1 text-[12.5px] font-medium text-ink-4">
            <NotebookPen className="size-3.5" strokeWidth={1.8} />
            最近记的
          </h2>
          <ul className="mt-2 space-y-2">
            {recent.map((r) => (
              <li
                key={r.id}
                className="rounded-[14px] bg-card px-3.5 py-2.5 shadow-[var(--shadow-soft-sm)]"
              >
                <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-2">
                  {r.content}
                </p>
                <p className="mt-1 text-[11px] text-ink-5">
                  {r.createdAt.slice(5, 16).replace("T", " ")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
