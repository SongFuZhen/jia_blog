"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, X } from "lucide-react";
import { XfyunIat } from "@/lib/xfyun-speech";
import { useSettingsStore } from "@/lib/stores/settings";
import { useConfirm } from "@/lib/stores/confirm";
import { aiBoyfriendPrompt } from "@/lib/ai-boyfriend";

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
  const finalRef = useRef(""); // 识别最终文本
  const messagesRef = useRef<Msg[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  // 设置里的「小祯子」风格：打开时确保已加载；发送时实时读取最新值
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const confirm = useConfirm();

  // 关闭前提示：对话不保存，有内容时确认一下
  async function handleClose() {
    if (messages.length > 0) {
      const ok = await confirm({
        title: "结束对话？",
        message: "对话不会保存，关闭后这次聊天就找不回来啦～",
        confirmText: "结束",
      });
      if (!ok) return;
    }
    onClose();
  }

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // 每次打开都是新会话，并直接进入「听」的状态，点开就能说
  useEffect(() => {
    if (open) {
      hydrateSettings(); // 确保「小祯子」风格已加载（即便没进过设置页）
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
    }
  }, [open]);

  async function send(text: string) {
    const aiId = uid();
    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", content: text },
      { id: aiId, role: "assistant", content: "" },
    ]);
    setBusy(true);

    try {
      // 取最新风格（避免会话中途改设置后还用旧 prompt）
      const prompt = aiBoyfriendPrompt(useSettingsStore.getState().settings.aiStyle);
      const turns = [
        { role: "system" as const, content: prompt },
        ...messagesRef.current.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: text },
      ];
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: turns }),
      });
      if (!res.ok || !res.body) {
        const msg = (await res.text().catch(() => "")) || `AI 接口 ${res.status}`;
        throw new Error(msg.slice(0, 200));
      }
      // 流式读取，逐片追加到小祯子的气泡
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const piece = decoder.decode(value, { stream: true });
        if (piece) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiId ? { ...m, content: m.content + piece } : m,
            ),
          );
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI 连接失败";
      setMessages((prev) =>
        prev.map((m) => (m.id === aiId ? { ...m, content: `（${msg}）` } : m)),
      );
    } finally {
      setBusy(false);
    }
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
        onClick={handleClose}
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-[430px] flex-col">
        <div className="flex max-h-[92vh] flex-col rounded-t-[28px] bg-white dark:bg-[#231B1E] px-5 pt-3 pb-7 shadow-[var(--shadow-soft-lg)]">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong" />

          {/* 头部 */}
          <div className="flex items-center justify-between px-0.5">
            <div>
              <p className="text-[15px] font-semibold text-ink">小祯子</p>
              <p className="mt-0.5 text-[11px] text-ink-4">聊完即焚 · 对话不保存</p>
            </div>
            <button
              onClick={handleClose}
              aria-label="关闭"
              className="flex size-8 items-center justify-center rounded-full bg-field text-ink-3"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
          </div>

          {/* 消息列表 */}
          <div
            ref={listRef}
            className="mt-3 min-h-[320px] flex-1 space-y-3 overflow-y-auto pb-1"
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
              <div className="mx-auto flex w-fit max-w-[82%] items-center gap-2 rounded-[18px] rounded-bl-[6px] bg-[#FFF3F5] px-3.5 py-2.5 text-[13px] text-ink">
                <Bars />
                <span className="whitespace-pre-wrap">{draft}</span>
              </div>
            )}

            {error && (
              <p className="mx-auto w-fit rounded-full bg-[#FCEBED] px-3.5 py-2 text-[12.5px] text-[#E5484D]">
                {error}
              </p>
            )}
          </div>

          {/* 麦克风按钮 */}
          <div className="mt-5 flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              {/* 录音呼吸波纹 */}
              {recording && (
                <>
                  <span className="absolute size-[78px] rounded-full bg-[#FF92A8]/30 animate-ping" />
                  <span className="absolute size-[78px] rounded-full bg-[#FF92A8]/20 animate-ping [animation-delay:600ms]" />
                </>
              )}
              <button
                onClick={toggleMic}
                disabled={busy}
                aria-label={recording ? "结束说话" : "开始说话"}
                className={`relative flex size-[64px] items-center justify-center rounded-full transition-all duration-200 ${
                  recording
                    ? "bg-[#E5484D] text-white shadow-[0_8px_22px_rgba(229,72,77,0.45)]"
                    : "bg-gradient-to-b from-[#FF92A8] to-[#F16D88] text-white shadow-[0_8px_18px_rgba(242,111,134,0.45)]"
                } ${busy ? "opacity-50" : "active:scale-[0.92] hover:scale-[1.04]"}`}
              >
                <Mic className="size-6" strokeWidth={2} />
              </button>
            </div>
            <p className="mt-3 text-[12.5px] text-ink-4">
              {busy
                ? "小助手正在想…"
                : recording
                  ? "正在听… 点一下结束并发送"
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

function Bars() {
  const bars = [0, 120, 240, 360, 480];
  return (
    <span className="flex h-3.5 items-end gap-[2px]">
      {bars.map((d, i) => (
        <span
          key={i}
          className="w-[2px] animate-bounce rounded-full bg-[#F16D88]"
          style={{ height: "100%", animationDelay: `${d}ms` }}
        />
      ))}
    </span>
  );
}
