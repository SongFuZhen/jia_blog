"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { verifyPrivatePassword } from "@/app/actions";
import { setPrivateCredential } from "@/lib/repository";
import { useConfirm } from "@/lib/stores/confirm";
import { usePrivateStore } from "@/lib/stores/private";
import { useSettingsStore } from "@/lib/stores/settings";
import { useAutoLock } from "@/lib/use-auto-lock";
import {
  ArrowLeft,
  CalendarHeart,
  Heart,
  ListChecks,
  Loader2,
  Lock,
  Plus,
  Scale,
  Trash2,
  Unlock,
} from "lucide-react";
import type { Mood } from "@/lib/types";

const moods: Mood[] = ["开心", "幸福", "平静", "委屈", "难过", "生气", "好困", "有成就感"];

/** 体重趋势：SVG 折线（最近 30 条） */
function WeightTrend({ logs }: { logs: { date: string; weight: number }[] }) {
  const points = logs.slice(-30);
  if (points.length < 2) return null;

  const weights = points.map((p) => p.weight);
  const min = Math.min(...weights) - 0.5;
  const max = Math.max(...weights) + 0.5;
  const w = 300;
  const h = 80;
  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * (w - 16) + 8;
    const y = h - 12 - ((p.weight - min) / (max - min || 1)) * (h - 24);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full">
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="#F16D88"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map((c, i) => {
        const [x, y] = c.split(",");
        return (
          <circle key={i} cx={x} cy={y} r="3" fill="#E96882" />
        );
      })}
    </svg>
  );
}

export default function PrivatePage() {
  const {
    locked,
    weightLogs,
    periodLogs,
    diaries,
    secrets,
    hydrated,
    unlock,
    lock,
    hydrate,
    addWeightLog,
    addPeriodLog,
    addDiary,
    removeDiary,
    addSecret,
    toggleSecret,
    removeSecret,
  } = usePrivateStore();
  const confirm = useConfirm();
  const settings = useSettingsStore((s) => s.settings);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);

  const [pwd, setPwd] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  // 新增表单
  const [weightInput, setWeightInput] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [periodFeeling, setPeriodFeeling] = useState("");
  const [diaryContent, setDiaryContent] = useState("");
  const [diaryMood, setDiaryMood] = useState<Mood | null>(null);
  const [addingSecret, setAddingSecret] = useState(false);
  const [secretText, setSecretText] = useState("");

  async function handleAddSecret() {
    if (!secretText.trim()) return;
    await addSecret(secretText.trim());
    setSecretText("");
    setAddingSecret(false);
  }


  useEffect(() => {
    hydrateSettings();
  }, [hydrateSettings]);

  /** 上锁：清凭证 + 清内存数据 */
  const handleLock = useCallback(() => {
    setPrivateCredential(null);
    lock();
  }, [lock]);

  useAutoLock(!locked && (settings.autoLock ?? true), handleLock);

  // 解锁后加载数据
  useEffect(() => {
    if (!locked) hydrate();
  }, [locked, hydrate]);

  async function handleUnlock() {
    if (checking || pwd.length === 0) return;
    setChecking(true);
    setError(false);
    const ok = await verifyPrivatePassword(pwd);
    setChecking(false);
    if (ok) {
      setPrivateCredential(pwd);
      setPwd("");
      unlock();
    } else {
      setError(true);
    }
  }

  /** 周期推算：以最近一次经期开始 + 28 天估算 */
  const periodInfo = useMemo(() => {
    if (periodLogs.length === 0) return null;
    const latest = periodLogs[0]; // 已按 start 倒序
    const start = new Date(`${latest.start}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayDiff = Math.floor((today.getTime() - start.getTime()) / 86400000);
    const cycle = 28;
    if (dayDiff >= 0 && dayDiff <= 5) {
      return { text: `经期第 ${dayDiff + 1} 天`, tip: latest.feeling ? `状态：${latest.feeling} · 早点休息` : "记得多喝热水、注意保暖" };
    }
    const nextStart = new Date(start);
    nextStart.setDate(nextStart.getDate() + cycle);
    const daysUntil = Math.floor((nextStart.getTime() - today.getTime()) / 86400000);
    if (daysUntil > 0) {
      return {
        text: `预计 ${daysUntil} 天后到来 · 记录周期 ${cycle} 天`,
        tip: daysUntil <= 3 ? "记得提前备好红糖和暖宝宝呀" : "一切照常，好好生活～",
      };
    }
    return { text: "周期已超过 28 天", tip: "如果来了记得记录一下哦" };
  }, [periodLogs]);

  const target = settings.targetWeight ?? 49.9;
  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1] : null;
  const remain =
    latestWeight && latestWeight.weight > target
      ? latestWeight.weight - target
      : null;

  if (locked) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-background px-6 pb-32">
        <header className="flex items-center gap-2 pt-9">
          <Link
            href="/"
            aria-label="返回"
            className="flex size-9 items-center justify-center rounded-full bg-white text-ink-3 dark:bg-[#2B2225] shadow-[var(--shadow-xs)] transition-colors hover:text-[#E0697E]"
          >
            <ArrowLeft className="size-4.5" strokeWidth={1.8} />
          </Link>
        </header>

        <div className="mt-16 flex flex-col items-center">
          <div className="rounded-[28px] bg-gradient-to-b from-pink-soft to-pink-soft-2 p-8 shadow-[var(--shadow-soft-md)]">
            <div className="flex flex-col items-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-[#D56983] text-white shadow-[0_6px_16px_rgba(213,105,131,0.35)]">
                <Lock className="size-6" strokeWidth={1.8} />
              </span>
              <h1 className="mt-4 text-[18px] font-bold text-pink-ink">
                专属私密空间
              </h1>
              <p className="mt-1.5 text-center text-[12.5px] text-ink-3">
                这里放着只属于你的小秘密
                <br />
                输入密码才能进入哦
              </p>

              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pwd}
                onChange={(e) => {
                  setPwd(e.target.value.replace(/\D/g, ""));
                  setError(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUnlock();
                }}
                placeholder="····"
                autoFocus
                className={`mt-6 h-12 w-[180px] rounded-[14px] border bg-white text-center text-[20px] tracking-[10px] outline-none placeholder:text-ink-5 focus:border-[#E96882] ${
                  error ? "border-[#E76F7B]" : "border-border-strong"
                }`}
              />
              {error && (
                <p className="mt-2 text-[12px] text-[#E76F7B]">
                  密码不对哦，再想想～
                </p>
              )}

              <button
                onClick={handleUnlock}
                disabled={checking}
                className="mt-5 inline-flex h-11 w-[180px] items-center justify-center gap-1.5 rounded-[14px] bg-[#E96882] text-[14.5px] font-medium text-white shadow-[0_6px_16px_rgba(233,104,130,0.32)] transition-colors hover:bg-[#D56983] disabled:opacity-60"
              >
                {checking ? (
                  <Loader2 className="size-4 animate-spin" strokeWidth={1.8} />
                ) : (
                  <Unlock className="size-4" strokeWidth={1.8} />
                )}
                {checking ? "验证中…" : "去解锁"}
              </button>

              <p className="mt-4 text-[11.5px] text-ink-5">
                忘记密码的话，悄悄问问他吧
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <header className="flex items-center justify-between pt-9">
        <div>
          <h1 className="text-[22px] font-bold text-ink">
            欢迎回来，{settings.nickname}
          </h1>
          <p className="font-display mt-1.5 text-[15px] text-ink-3">
            这里只有你能进来
          </p>
        </div>
        <button
          onClick={handleLock}
          className="flex items-center gap-1.5 rounded-full bg-white px-3.5 dark:bg-[#2B2225] py-2 text-[12.5px] font-medium text-ink-3 shadow-[var(--shadow-xs)] transition-colors hover:text-[#E0697E]"
        >
          <Lock className="size-3.5" strokeWidth={1.8} />
          上锁
        </button>
      </header>

      {/* 体重记录 */}
      <section className="mt-5 rounded-[20px] bg-card p-4 shadow-[var(--shadow-soft-sm)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-orange-soft text-orange-ink">
              <Scale className="size-4" strokeWidth={1.8} />
            </span>
            <h2 className="text-[14.5px] font-semibold text-ink">体重记录</h2>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="今天 52.3"
              inputMode="decimal"
              className="w-[88px] rounded-[10px] bg-field px-2.5 py-1.5 text-right text-[12.5px] outline-none placeholder:text-ink-5"
            />
            <button
              onClick={async () => {
                const v = parseFloat(weightInput);
                if (!v || v <= 0 || v > 300) return;
                await addWeightLog({
                  date: new Date().toISOString().slice(0, 10),
                  weight: v,
                });
                setWeightInput("");
              }}
              disabled={!weightInput}
              className="rounded-full bg-pink-soft px-3 py-1.5 text-[11.5px] font-medium text-[#E0697E] transition-colors hover:bg-pink-hover disabled:opacity-40"
            >
              记一笔
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <p className="text-[26px] leading-none font-bold text-ink">
            {latestWeight ? latestWeight.weight : "--"}
            <span className="ml-1 text-[13.5px] font-medium text-ink-4">kg</span>
          </p>
          {remain !== null && (
            <p className="text-[12px] text-ink-4">
              距目标还差 <span className="text-[#E0697E]">{remain.toFixed(1)} kg</span>
            </p>
          )}
        </div>
        <WeightTrend logs={weightLogs} />
        <p className="mt-1 text-[11px] text-ink-5">
          目标 {target} kg · 认识自己的身体，而不是要求自己变成某个数字
        </p>
      </section>

      {/* 经期提醒 */}
      <section className="mt-3 rounded-[20px] bg-gradient-to-r from-pink-soft to-pink-soft-2 p-4 shadow-[var(--shadow-soft-sm)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-[#D56983] text-white">
              <CalendarHeart className="size-4" strokeWidth={1.8} />
            </span>
            <h2 className="text-[14.5px] font-semibold text-ink">经期提醒</h2>
          </div>
        </div>
        {periodInfo ? (
          <>
            <p className="mt-3 text-[13.5px] text-ink-2">
              <span className="font-bold text-pink-ink">{periodInfo.text}</span>
            </p>
            <p className="mt-1 text-[11.5px] text-ink-4">{periodInfo.tip}</p>
          </>
        ) : (
          <p className="mt-3 text-[13px] text-ink-2">
            还没有记录，先记下最近一次开始的日子吧
          </p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="flex-1 rounded-[10px] bg-white/80 dark:bg-field/90 px-2.5 py-1.5 text-[12px] text-ink-2 outline-none"
          />
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="flex-1 rounded-[10px] bg-white/80 dark:bg-field/90 px-2.5 py-1.5 text-[12px] text-ink-2 outline-none"
          />
          <button
            onClick={async () => {
              if (!periodStart) return;
              await addPeriodLog({
                start: periodStart,
                end: periodEnd || undefined,
                symptoms: [],
                feeling: periodFeeling.trim() || undefined,
              });
              setPeriodStart("");
              setPeriodEnd("");
              setPeriodFeeling("");
            }}
            disabled={!periodStart}
            className="shrink-0 rounded-full bg-[#E96882] px-3.5 py-1.5 text-[12px] font-medium text-white shadow-[0_4px_12px_rgba(233,104,130,0.3)] transition-colors hover:bg-[#D56983] disabled:opacity-40"
          >
            记录
          </button>
        </div>
        <input
          value={periodFeeling}
          onChange={(e) => setPeriodFeeling(e.target.value)}
          placeholder="这次的感觉（选填）：有点累 / 腰酸…"
          className="mt-2 w-full rounded-[10px] bg-white/80 dark:bg-field/90 px-2.5 py-1.5 text-[12px] outline-none placeholder:text-ink-5"
        />
      </section>

      {/* 私密日记 */}
      <section className="mt-3 rounded-[20px] bg-card p-4 shadow-[var(--shadow-soft-sm)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-pink-soft text-[#E0697E]">
              <Heart className="size-4" strokeWidth={1.8} />
            </span>
            <h2 className="text-[14.5px] font-semibold text-ink">私密日记</h2>
          </div>
          <p className="text-[11px] text-ink-5">🔒 只有你能看到</p>
        </div>

        <div className="mt-3">
          <textarea
            value={diaryContent}
            onChange={(e) => setDiaryContent(e.target.value)}
            rows={2}
            placeholder="只写给自己的话…"
            className="w-full resize-none rounded-[12px] bg-field px-3 py-2.5 text-[13px] leading-relaxed outline-none placeholder:text-ink-5"
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="flex gap-1.5">
              {moods.map((m) => (
                <button
                  key={m}
                  onClick={() => setDiaryMood(diaryMood === m ? null : m)}
                  className={`rounded-full px-2.5 py-1 text-[11px] transition-colors ${
                    diaryMood === m
                      ? "bg-pink-soft font-medium text-[#E0697E]"
                      : "bg-cream text-ink-3"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              onClick={async () => {
                if (!diaryContent.trim()) return;
                await addDiary({
                  date: new Date().toISOString().slice(0, 10),
                  content: diaryContent.trim(),
                  mood: diaryMood ?? undefined,
                });
                setDiaryContent("");
                setDiaryMood(null);
              }}
              disabled={!diaryContent.trim()}
              className="shrink-0 rounded-full bg-[#E96882] px-3.5 py-1.5 text-[12px] font-medium text-white shadow-[0_4px_12px_rgba(233,104,130,0.3)] transition-colors hover:bg-[#D56983] disabled:opacity-40"
            >
              写下来
            </button>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {diaries.map((d) => (
            <div
              key={d.id}
              className="group/diary relative rounded-[12px] bg-card-warm px-3.5 py-2.5"
            >
              <div className="flex items-center gap-2">
                <p className="text-[11px] text-ink-5">{d.date}</p>
                {d.mood && (
                  <span className="rounded-full bg-pink-soft px-2 py-[2px] text-[10px] leading-none text-[#E0697E]">
                    {d.mood}
                  </span>
                )}
                <button
                  onClick={async () => {
                    const ok = await confirm({
                      title: "删掉这段悄悄话？",
                      confirmText: "删除",
                      danger: true,
                    });
                    if (ok) removeDiary(d.id);
                  }}
                  aria-label="删除"
                  className="ml-auto text-ink-5 opacity-0 transition-opacity group-hover/diary:opacity-100 hover:text-[#E76F7B]"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.8} />
                </button>
              </div>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
                {d.content}
              </p>
            </div>
          ))}
          {hydrated && diaries.length === 0 && (
            <p className="py-2 text-center text-[12px] text-ink-5">
              还没有私密日记
            </p>
          )}
        </div>
      </section>

      {/* 小秘密清单 */}
      <section className="mt-3 rounded-[20px] bg-card p-4 shadow-[var(--shadow-soft-sm)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-pink-soft text-[#E0697E]">
              <ListChecks className="size-4" strokeWidth={1.8} />
            </span>
            <h2 className="text-[14.5px] font-semibold text-ink">小秘密清单</h2>
          </div>
          {secrets.length > 0 && (
            <p className="text-[11px] text-ink-5">
              完成 {secrets.filter((s) => s.done).length} / {secrets.length}
            </p>
          )}
        </div>

        <ul className="mt-3 space-y-1">
          {secrets.map((s) => (
            <li key={s.id} className="group/secret relative">
              <button
                onClick={() => toggleSecret(s.id)}
                className="flex w-full items-center gap-3 rounded-xl px-1.5 py-2 text-left transition-colors hover:bg-card-hover"
              >
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    s.done
                      ? "border-[#D56983] bg-[#D56983] text-white"
                      : "border-toggle-off bg-white dark:bg-card"
                  }`}
                >
                  {s.done && <Heart className="size-2.5 fill-white text-white" />}
                </span>
                <span
                  className={`text-[13px] ${
                    s.done ? "text-ink-5 line-through" : "text-ink"
                  }`}
                >
                  {s.text}
                </span>
              </button>
                <button
                  onClick={async () => {
                    const ok = await confirm({
                      title: "删掉这个心愿？",
                      confirmText: "删除",
                      danger: true,
                    });
                    if (ok) removeSecret(s.id);
                  }}
                aria-label="删除"
                className="absolute top-2.5 right-1.5 text-ink-5 opacity-0 transition-opacity group-hover/secret:opacity-100 hover:text-[#E76F7B]"
              >
                <Trash2 className="size-3.5" strokeWidth={1.8} />
              </button>
            </li>
          ))}
          {hydrated && secrets.length === 0 && (
            <li className="py-2 text-center text-[12px] text-ink-5">
              还没有小秘密，许一个吧
            </li>
          )}
        </ul>

        {addingSecret ? (
          <div className="mt-2 flex gap-2">
            <input
              value={secretText}
              onChange={(e) => setSecretText(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter") await handleAddSecret();
                if (e.key === "Escape") setAddingSecret(false);
              }}
              autoFocus
              placeholder="想去做 / 想要的小心愿"
              className="w-full rounded-[10px] bg-field px-3 py-2 text-[12.5px] text-ink outline-none"
            />
            <button
              onClick={handleAddSecret}
              disabled={!secretText.trim()}
              className="shrink-0 rounded-full bg-[#E96882] px-3.5 py-1.5 text-[12px] font-medium text-white disabled:opacity-40"
            >
              收下
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setAddingSecret(true);
              setSecretText("");
            }}
            className="mt-2 inline-flex items-center gap-1 rounded-full bg-field px-3 py-1.5 text-[11.5px] text-ink-3 transition-colors hover:bg-pink-soft hover:text-[#E0697E]"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            加一个心愿
          </button>
        )}
      </section>
    </main>
  );
}
