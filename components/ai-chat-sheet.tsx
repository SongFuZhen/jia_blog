"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, X } from "lucide-react";
import { XfyunIat } from "@/lib/xfyun-speech";
import { XfyunSpark, type SparkMessage } from "@/lib/xfyun-spark";

const SYSTEM_PROMPT =
  "你是小佳佳的生活助理，语气温柔可爱，像她的好朋友。用简体中文，简短回复，适当用 emoji。";

type Msg = { id: string; role: "user" | "assistant"; content: string };

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function AiChatSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [recording, setRecording] = useState(false);
  const [draft, setDraft] = useState(""); // 实时识别预览
  const [busy, setBusy] = useState(false); // AI 思考/流式回复中
  const [error, setError] = useState<string | null>(null);

  const iatRef = useRef<XfyunIat | null>(null);
  const sparkRef = useRef<XfyunSpark | null>(null);
  const finalRef = useRef(""); // 识别最终文本
  const messagesRef = useRef<Msg[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // 每次打开都是新会话，并直接进入「听」的状态，点开就能说
  useEffect(() => {
    if (open) {
      setMessages([]);
      setDraft("");
      setError(null);
      setBusy(false);
      setRecording(false);
      startRecording();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 滚到底
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, draft, busy]);

  // 关闭时释放资源
  useEffect(() => {
    if (!open) {
      iatRef.current?.stop();
      iatRef.current = null;
      sparkRef.current?.close();
      sparkRef.current = null;
    }
  }, [open]);

  function send(text: string) {
    const history: SparkMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messagesRef.current.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: text },
    ];

    const aiId = uid();
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", content: text },
      { id: aiId, role: "assistant", content: "" },
    ]);
    setBusy(true);

    const spark = new XfyunSpark();
    sparkRef.current = spark;
    spark.chat(history, {
      onDelta: (d) =>
        setMessages((prev) =>
          prev.map((m) => (m.id === aiId ? { ...m, content: m.content + d } : m)),
        ),
      onDone: () => setBusy(false),
      onError: (m) => {
        setBusy(false);
        setMessages((prev) =>
          prev.map((mm) =>
            mm.id === aiId
              ? { ...mm, content: mm.content || `（${m}）` }
              : mm,
          ),
        );
      },
    });
  }

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

  function stopAndSend() {
    iatRef.current?.stop();
    iatRef.current = null;
    setRecording(false);
    const text = finalRef.current.trim();
    setDraft("");
    if (text) send(text);
  }

  function toggleMic() {
    if (busy) return;
    if (recording) stopAndSend();
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

          {/* 头部 */}
          <div className="flex items-center justify-between px-0.5">
            <p className="text-[15px] font-semibold text-ink">
              小佳佳的 AI 小助手
            </p>
            <button
              onClick={onClose}
              aria-label="关闭"
              className="flex size-8 items-center justify-center rounded-full bg-field text-ink-3"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
          </div>

          {/* 消息列表 */}
          <div
            ref={listRef}
            className="mt-3 min-h-[160px] flex-1 space-y-3 overflow-y-auto pb-1"
          >
            {messages.length === 0 && !recording && (
              <p className="mt-10 text-center text-[13px] text-ink-4">
                点下面的麦克风，跟我说点什么吧～
              </p>
            )}

            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <p className="max-w-[78%] whitespace-pre-wrap rounded-[16px] rounded-tr-[6px] bg-[#F16D88] px-3.5 py-2.5 text-[13.5px] leading-relaxed text-white">
                    {m.content}
                  </p>
                </div>
              ) : (
                <div key={m.id} className="flex justify-start">
                  <p className="max-w-[82%] whitespace-pre-wrap rounded-[16px] rounded-tl-[6px] bg-cream px-3.5 py-2.5 text-[13.5px] leading-relaxed text-ink">
                    {m.content ||
                      (busy ? (
                        <span className="inline-flex gap-1">
                          <Dot /> <Dot delay={150} /> <Dot delay={300} />
                        </span>
                      ) : (
                        "…"
                      ))}
                  </p>
                </div>
              ),
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

          {/* 麦克风按钮 */}
          <div className="mt-4 flex flex-col items-center">
            <button
              onClick={toggleMic}
              disabled={busy}
              aria-label={recording ? "结束说话" : "开始说话"}
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
                ? "小助手正在想…"
                : recording
                  ? "点一下结束，自动发送"
                  : "点一下，开始说"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="inline-block size-1.5 animate-bounce rounded-full bg-ink-4"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
