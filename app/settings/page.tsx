"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={on}
      className={`relative h-6.5 w-11 shrink-0 rounded-full transition-colors ${
        on ? "bg-[#F16D88]" : "bg-[#E8D5CE]"
      }`}
    >
      <span
        className={`absolute top-0.5 size-5.5 rounded-full bg-white shadow-sm transition-all ${
          on ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const [remind, setRemind] = useState(true);
  const [autoLock, setAutoLock] = useState(true);
  const [dark, setDark] = useState(false);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <PageHeader title="设置" subtitle="把小站调成喜欢的样子" />

      {/* 通用设置 */}
      <div className="mt-5 overflow-hidden rounded-[20px] bg-[#FEFCFB] shadow-[var(--shadow-soft-sm)]">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div>
            <p className="text-[14.5px] font-medium text-[#3B2E2A]">提醒我记录</p>
            <p className="mt-0.5 text-[11.5px] text-[#A8928B]">
              每晚八点，轻轻提醒一下
            </p>
          </div>
          <Toggle on={remind} onClick={() => setRemind(!remind)} />
        </div>
        <div className="flex items-center justify-between border-t border-[#F6EFEC] px-4 py-3.5">
          <div>
            <p className="text-[14.5px] font-medium text-[#3B2E2A]">
              离开时自动上锁
            </p>
            <p className="mt-0.5 text-[11.5px] text-[#A8928B]">
              私密空间更安心
            </p>
          </div>
          <Toggle on={autoLock} onClick={() => setAutoLock(!autoLock)} />
        </div>
        <div className="flex items-center justify-between border-t border-[#F6EFEC] px-4 py-3.5">
          <div>
            <p className="text-[14.5px] font-medium text-[#3B2E2A]">深色模式</p>
            <p className="mt-0.5 text-[11.5px] text-[#A8928B]">即将上线</p>
          </div>
          <Toggle on={dark} onClick={() => setDark(!dark)} />
        </div>
      </div>

      {/* 数据 */}
      <div className="mt-3 overflow-hidden rounded-[20px] bg-[#FEFCFB] shadow-[var(--shadow-soft-sm)]">
        <button className="flex w-full items-center justify-between px-4 py-3.5 transition-colors hover:bg-[#FFF8F5]">
          <span className="text-[14.5px] font-medium text-[#3B2E2A]">
            清除本地缓存
          </span>
          <span className="text-[12.5px] text-[#C0ABA3]">2.1 MB</span>
        </button>
        <button className="flex w-full items-center justify-between border-t border-[#F6EFEC] px-4 py-3.5 transition-colors hover:bg-[#FFF8F5]">
          <span className="text-[14.5px] font-medium text-[#3B2E2A]">
            导出我的数据
          </span>
          <span className="text-[12.5px] text-[#C0ABA3]">即将上线</span>
        </button>
      </div>

      {/* 关于 */}
      <div className="mt-3 rounded-[20px] bg-[#FEFCFB] p-5 text-center shadow-[var(--shadow-soft-sm)]">
        <p className="font-display text-[17px] text-[#B79A90]">
          小佳佳的生活日记
        </p>
        <p className="mt-1 text-[12px] text-[#C0ABA3]">Version 0.1.0</p>
        <p className="font-display mt-3 text-[13.5px] text-[#CBB3AA]">
          不必很完美 · 只需做自己
        </p>
      </div>
    </main>
  );
}
