"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { verifyPrivatePassword } from "@/app/actions";
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
  Scale,
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
    hydrated,
    unlock,
    lock,
    hydrate,
    addWeightLog,
    addPeriodLog,
    addDiary,
  } = usePrivateStore();
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

  useEffect(() => {
    hydrateSettings();
  }, [hydrateSettings]);

  useAutoLock(!locked && (settings.autoLock ?? true), lock);

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
            className="flex size-9 items-center justify-center rounded-full bg-white text-[#8A7A72] shadow-[var(--shadow-xs)] transition-colors hover:text-[#E0697E]"
          >
            <ArrowLeft className="size-4.5" strokeWidth={1.8} />
          </Link>
        </header>

        <div className="mt-16 flex flex-col items-center">
          <div className="rounded-[28px] bg-gradient-to-b from-[#FFF0F3] to-[#FFE7ED] p-8 shadow-[var(--shadow-soft-md)]">
            <div className="flex flex-col items-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-[#D56983] text-white shadow-[0_6px_16px_rgba(213,105,131,0.35)]">
                <Lock className="size-6" strokeWidth={1.8} />
              </span>
              <h1 className="mt-4 text-[18px] font-bold text-[#9F3E56]">
                专属私密空间
              </h1>
              <p className="mt-1.5 text-center text-[12.5px] text-[#9B777E]">
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
                className={`mt-6 h-12 w-[180px] rounded-[14px] border bg-white text-center text-[20px] tracking-[10px] outline-none placeholder:text-[#E3CBCF] focus:border-[#E96882] ${
                  error ? "border-[#E76F7B]" : "border-[#FFD1DB]"
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

              <p className="mt-4 text-[11.5px] text-[#C9A9AF]">
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
          <h1 className="text-[22px] font-bold text-[#2F2528]">
            欢迎回来，{settings.nickname}
          </h1>
          <p className="font-display mt-1.5 text-[15px] text-[#B79A90]">
            这里只有你能进来
          </p>
        </div>
        <button
          onClick={lock}
          className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[12.5px] font-medium text-[#8A7A72] shadow-[var(--shadow-xs)] transition-colors hover:text-[#E0697E]"
        >
          <Lock className="size-3.5" strokeWidth={1.8} />
          上锁
        </button>
      </header>

      {/* 体重记录 */}
      <section className="mt-5 rounded-[20px] bg-[#FEFCFB] p-4 shadow-[var(--shadow-soft-sm)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-[#FDEFE8] text-[#F08A4B]">
              <Scale className="size-4" strokeWidth={1.8} />
            </span>
            <h2 className="text-[14.5px] font-semibold text-[#3B2E2A]">体重记录</h2>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="今天 52.3"
              inputMode="decimal"
              className="w-[88px] rounded-[10px] bg-[#FAF5F2] px-2.5 py-1.5 text-right text-[12.5px] outline-none placeholder:text-[#C9B8B2]"
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
              className="rounded-full bg-[#FDECEC] px-3 py-1.5 text-[11.5px] font-medium text-[#E0697E] transition-colors hover:bg-[#FBDDE2] disabled:opacity-40"
            >
              记一笔
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <p className="text-[26px] leading-none font-bold text-[#3B2E2A]">
            {latestWeight ? latestWeight.weight : "--"}
            <span className="ml-1 text-[13.5px] font-medium text-[#A8928B]">kg</span>
          </p>
          {remain !== null && (
            <p className="text-[12px] text-[#A8928B]">
              距目标还差 <span className="text-[#E0697E]">{remain.toFixed(1)} kg</span>
            </p>
          )}
        </div>
        <WeightTrend logs={weightLogs} />
        <p className="mt-1 text-[11px] text-[#C0ABA3]">
          目标 {target} kg · 认识自己的身体，而不是要求自己变成某个数字
        </p>
      </section>

      {/* 经期提醒 */}
      <section className="mt-3 rounded-[20px] bg-gradient-to-r from-[#FFF0F3] to-[#FFE7ED] p-4 shadow-[var(--shadow-soft-sm)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-[#D56983] text-white">
              <CalendarHeart className="size-4" strokeWidth={1.8} />
            </span>
            <h2 className="text-[14.5px] font-semibold text-[#3B2E2A]">经期提醒</h2>
          </div>
        </div>
        {periodInfo ? (
          <>
            <p className="mt-3 text-[13.5px] text-[#5C4B45]">
              <span className="font-bold text-[#C94F6B]">{periodInfo.text}</span>
            </p>
            <p className="mt-1 text-[11.5px] text-[#A8928B]">{periodInfo.tip}</p>
          </>
        ) : (
          <p className="mt-3 text-[13px] text-[#5C4B45]">
            还没有记录，先记下最近一次开始的日子吧
          </p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="flex-1 rounded-[10px] bg-white/80 px-2.5 py-1.5 text-[12px] text-[#5C4B45] outline-none"
          />
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="flex-1 rounded-[10px] bg-white/80 px-2.5 py-1.5 text-[12px] text-[#5C4B45] outline-none"
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
          className="mt-2 w-full rounded-[10px] bg-white/80 px-2.5 py-1.5 text-[12px] outline-none placeholder:text-[#C9A9AF]"
        />
      </section>

      {/* 私密日记 */}
      <section className="mt-3 rounded-[20px] bg-[#FEFCFB] p-4 shadow-[var(--shadow-soft-sm)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-[#FDECEC] text-[#E0697E]">
              <Heart className="size-4" strokeWidth={1.8} />
            </span>
            <h2 className="text-[14.5px] font-semibold text-[#3B2E2A]">私密日记</h2>
          </div>
          <p className="text-[11px] text-[#C0ABA3]">🔒 只有你能看到</p>
        </div>

        <div className="mt-3">
          <textarea
            value={diaryContent}
            onChange={(e) => setDiaryContent(e.target.value)}
            rows={2}
            placeholder="只写给自己的话…"
            className="w-full resize-none rounded-[12px] bg-[#FAF5F2] px-3 py-2.5 text-[13px] leading-relaxed outline-none placeholder:text-[#C9B8B2]"
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="flex gap-1.5">
              {moods.map((m) => (
                <button
                  key={m}
                  onClick={() => setDiaryMood(diaryMood === m ? null : m)}
                  className={`rounded-full px-2.5 py-1 text-[11px] transition-colors ${
                    diaryMood === m
                      ? "bg-[#FDECEC] font-medium text-[#E0697E]"
                      : "bg-[#F7F0EC] text-[#8A7A72]"
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
              className="rounded-[12px] bg-[#FFF9F6] px-3.5 py-2.5"
            >
              <p className="text-[11px] text-[#C0ABA3]">
                {d.date}
                {d.mood && ` · ${d.mood}`}
              </p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-[#5C4B45]">
                {d.content}
              </p>
            </div>
          ))}
          {hydrated && diaries.length === 0 && (
            <p className="py-2 text-center text-[12px] text-[#C9B8B2]">
              还没有私密日记
            </p>
          )}
        </div>
      </section>

      {/* 小秘密清单（占位提醒） */}
      <section className="mt-3 rounded-[20px] bg-[#FEFCFB] p-4 shadow-[var(--shadow-soft-sm)]">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-[#FDECEC] text-[#E0697E]">
            <ListChecks className="size-4" strokeWidth={1.8} />
          </span>
          <h2 className="text-[14.5px] font-semibold text-[#3B2E2A]">小秘密清单</h2>
        </div>
        <div className="mt-3 space-y-2">
          {["想去看一次海", "学会盘头发", "攒钱买那支口红"].map((t) => (
            <div key={t} className="flex items-center gap-2">
              <Heart className="size-3.5 fill-[#F5B8C4] text-[#F5B8C4]" strokeWidth={1.8} />
              <span className="text-[12.5px] text-[#5C4B45]">{t}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
