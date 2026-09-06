"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarHeart,
  Heart,
  ListChecks,
  Lock,
  Scale,
  Unlock,
} from "lucide-react";

const PASSWORD = "0723";

export default function PrivatePage() {
  const [locked, setLocked] = useState(true);
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState(false);

  function handleUnlock() {
    if (pwd === PASSWORD) {
      setLocked(false);
      setError(false);
    } else {
      setError(true);
    }
  }

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
                className="mt-5 inline-flex h-11 w-[180px] items-center justify-center gap-1.5 rounded-[14px] bg-[#E96882] text-[14.5px] font-medium text-white shadow-[0_6px_16px_rgba(233,104,130,0.32)] transition-colors hover:bg-[#D56983]"
              >
                <Unlock className="size-4" strokeWidth={1.8} />
                去解锁
              </button>

              <p className="mt-4 text-[11.5px] text-[#C9A9AF]">
                演示密码：{PASSWORD}
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
            欢迎回来，小佳佳
          </h1>
          <p className="font-display mt-1.5 text-[15px] text-[#B79A90]">
            这里只有你能进来
          </p>
        </div>
        <button
          onClick={() => {
            setLocked(true);
            setPwd("");
          }}
          className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[12.5px] font-medium text-[#8A7A72] shadow-[var(--shadow-xs)] transition-colors hover:text-[#E0697E]"
        >
          <Lock className="size-3.5" strokeWidth={1.8} />
          上锁
        </button>
      </header>

      {/* 体重记录 */}
      <section className="mt-5 rounded-[20px] bg-[#FEFCFB] p-4 shadow-[var(--shadow-soft-sm)]">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-[#FDEFE8] text-[#F08A4B]">
            <Scale className="size-4" strokeWidth={1.8} />
          </span>
          <h2 className="text-[14.5px] font-semibold text-[#3B2E2A]">体重记录</h2>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <p className="text-[26px] leading-none font-bold text-[#3B2E2A]">
            52.3
            <span className="ml-1 text-[13.5px] font-medium text-[#A8928B]">
              kg
            </span>
          </p>
          <p className="text-[12px] text-[#A8928B]">
            距目标还差 <span className="text-[#E0697E]">2.4 kg</span>
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F7EDE8]">
          <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-[#FFB4C3] to-[#F16D88]" />
        </div>
        <p className="mt-2 text-[11px] text-[#C0ABA3]">
          目标 49.9 kg · 已完成 62%
        </p>
      </section>

      {/* 经期提醒 */}
      <section className="mt-3 rounded-[20px] bg-gradient-to-r from-[#FFF0F3] to-[#FFE7ED] p-4 shadow-[var(--shadow-soft-sm)]">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-[#D56983] text-white">
            <CalendarHeart className="size-4" strokeWidth={1.8} />
          </span>
          <h2 className="text-[14.5px] font-semibold text-[#3B2E2A]">经期提醒</h2>
        </div>
        <p className="mt-3 text-[13.5px] text-[#5C4B45]">
          预计 <span className="font-bold text-[#C94F6B]">3 天后</span> 到来
          · 记录周期 28 天
        </p>
        <p className="mt-1 text-[11.5px] text-[#A8928B]">
          记得提前备好红糖和暖宝宝呀
        </p>
      </section>

      {/* 小秘密清单 */}
      <section className="mt-3 rounded-[20px] bg-[#FEFCFB] p-4 shadow-[var(--shadow-soft-sm)]">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-[#FDECEC] text-[#E0697E]">
            <ListChecks className="size-4" strokeWidth={1.8} />
          </span>
          <h2 className="text-[14.5px] font-semibold text-[#3B2E2A]">
            小秘密清单
          </h2>
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
