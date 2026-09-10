"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Mic, X } from "lucide-react";
import { XfyunIat } from "@/lib/xfyun-speech";
import { useRecordsStore } from "@/lib/stores/records";

export function VoiceMemoSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(""); // 实时转写预览
  const [recording, setRecording] = useState(false);
  const [saved, setSaved] = useState<string | null>(null); // 最近一次保存的内容
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false); // 保存中

  const iatRef = useRef<XfyunIat | null>(null);
  const finalRef = useRef("");
  const addRecord = useRecordsStore((s) => s.addRecord);
  const listRef = useRef<HTMLDivElement>(null);

  // 每次打开新会话，并直接进入「听」的状态
  useEffect(() => {
    if (open) {
      setDraft("");
      setError(null);
      setSaved(null);
      setRecording(false);
      startRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [draft, saved, recording]);

  // 关闭时释放麦克风
  useEffect(() => {
    if (!open) {
      iatRef.current?.stop();
      iatRef.current = null;
    }
  }, [open]);

  function startRecording() {
    setError(null);
    finalRef.current = "";
    setDraft("");
    const iat = new XfyunIat();
    iatRef.current = iat;
    iat.start({
      onResult: (t) => {
        finalRef.current = t;
        setDraft(t);
      },
      onError: (m) => {
        setRecording(false);
        setError(m);
      },
      onState: (r) => setRecording(r),
    });
  }

  async function stopAndSave() {
    iatRef.current?.stop();
    iatRef.current = null;
    setRecording(false);
    const text = finalRef.current.trim();
    setDraft("");
    if (!text) {
      setError("没听清，再说一遍～");
      return;
    }
    setBusy(true);
    try {
      const title = text.split(/[。！？\n]/)[0].slice(0, 20) || "语音速记";
      await addRecord({
        type: "diary",
        title,
        content: text,
        images: [],
        mood: null,
        tags: [],
        visibility: "私人收藏",
        draft: false,
        createdAt: new Date().toISOString(),
      });
      setSaved(text);
    } catch {
      setError("保存失败了，网络好像不太顺，再试一次～");
    } finally {
      setBusy(false);
    }
  }

  function toggleMic() {
    if (busy) return;
    if (recording) stopAndSave();
    else startRecording();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-[430px] flex-col">
        <div className="flex max-h-[88vh] flex-col rounded-t-[28px] bg-white dark:bg-[#231B1E] px-5 pt-3 pb-7 shadow-[var(--shadow-soft-lg)]">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong" />

          <div className="flex items-center justify-between px-0.5">
            <p className="text-[15px] font-semibold text-ink">语音速记</p>
            <button
              onClick={onClose}
              aria-label="关闭"
              className="flex size-8 items-center justify-center rounded-full bg-field text-ink-3"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
          </div>

          <div
            ref={listRef}
            className="mt-3 min-h-[160px] flex-1 space-y-3 overflow-y-auto pb-1"
          >
            {!saved && !recording && !draft && (
              <p className="mt-10 text-center text-[13px] text-ink-4">
                点下面的麦克风，想到什么就说～
                <br />
                说完自动存进「我的日记」
              </p>
            )}

            {saved && (
              <div className="flex justify-start">
                <div className="max-w-[82%] rounded-[16px] rounded-tl-[6px] bg-cream px-3.5 py-2.5">
                  <p className="flex items-center gap-1 text-[11.5px] font-medium text-[#4E9A6E]">
                    <Check className="size-3.5" strokeWidth={2.4} /> 已记下
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">
                    {saved}
                  </p>
                  <Link
                    href="/diary"
                    onClick={onClose}
                    className="mt-2 inline-block text-[12px] font-medium text-[#F16D88]"
                  >
                    去日记看看 →
                  </Link>
                </div>
              </div>
            )}

            {recording && draft && (
              <p className="mx-auto w-fit max-w-[82%] rounded-full bg-field px-3.5 py-2 text-[12.5px] text-ink-3">
                正在听：{draft}
              </p>
            )}

            {error && (
              <p className="mx-auto w-fit rounded-full bg-[#FCEBED] px-3.5 py-2 text-[12.5px] text-[#E5484D]">
                {error}
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-col items-center">
            <button
              onClick={toggleMic}
              disabled={busy}
              aria-label={recording ? "结束并保存" : "开始说话"}
              className={`flex size-[60px] items-center justify-center rounded-full transition-all duration-200 ${
                recording
                  ? "bg-[#E5484D] text-white shadow-[0_6px_18px_rgba(229,72,77,0.4)]"
                  : "bg-gradient-to-b from-[#FF92A8] to-[#F16D88] text-white shadow-[0_6px_16px_rgba(242,111,134,0.42)]"
              } ${busy ? "opacity-50" : "active:scale-95"} ${recording ? "animate-pulse" : ""}`}
            >
              <Mic className="size-6" strokeWidth={2} />
            </button>
            <p className="mt-2 text-[12px] text-ink-4">
              {busy
                ? "正在保存…"
                : recording
                  ? "点一下结束，自动保存"
                  : saved
                    ? "再说一条"
                    : "点一下，开始说"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
