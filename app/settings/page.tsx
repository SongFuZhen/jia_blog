"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { useSettingsStore } from "@/lib/stores/settings";
import { useBeautyStore } from "@/lib/stores/beauty";
import { useRecordsStore } from "@/lib/stores/records";

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
  const { settings, hydrate, updateSettings } = useSettingsStore();
  const beautyHydrate = useBeautyStore((s) => s.hydrate);
  const recordsHydrate = useRecordsStore((s) => s.hydrate);

  const [remind, setRemind] = useState(true);
  const [nickname, setNickname] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [syncedSettings, setSyncedSettings] = useState(settings);

  useEffect(() => {
    hydrate();
    beautyHydrate();
    recordsHydrate();
  }, [hydrate, beautyHydrate, recordsHydrate]);

  // settings 从 store 加载完成后，同步一次到本地表单（渲染期同步，避免 effect 级联）
  if (settings !== syncedSettings) {
    setSyncedSettings(settings);
    setNickname(settings.nickname);
    setTargetWeight(settings.targetWeight ? String(settings.targetWeight) : "");
  }

  async function saveProfile() {
    await updateSettings({
      nickname: nickname.trim() || "小佳佳",
      targetWeight: parseFloat(targetWeight) || undefined,
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  function clearCache() {
    if (!window.confirm("会清掉所有本地记录（含私密空间数据），确定吗？")) return;
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("jia-blog:")) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  }

  function exportData() {
    const data: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("jia-blog:")) {
        data[k] = localStorage.getItem(k);
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jia-blog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const sizeLabel = "全部保存在这台设备上";

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <PageHeader title="设置" subtitle="把小站调成喜欢的样子" />

      {/* 个人资料 */}
      <div className="mt-5 space-y-3 rounded-[20px] bg-[#FEFCFB] p-4 shadow-[var(--shadow-soft-sm)]">
        <div>
          <p className="text-[12.5px] font-medium text-[#8A7A72]">你的昵称</p>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="小佳佳"
            className="mt-1.5 w-full rounded-[12px] bg-[#FAF5F2] px-3 py-2.5 text-[13.5px] outline-none"
          />
        </div>
        <div>
          <p className="text-[12.5px] font-medium text-[#8A7A72]">体重目标（kg）</p>
          <input
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="49.9"
            inputMode="decimal"
            className="mt-1.5 w-full rounded-[12px] bg-[#FAF5F2] px-3 py-2.5 text-[13.5px] outline-none"
          />
        </div>
        <button
          onClick={saveProfile}
          className="h-9 w-full rounded-[12px] bg-[#E96882] text-[13.5px] font-medium text-white shadow-[0_4px_12px_rgba(233,104,130,0.3)]"
        >
          {savedFlash ? "保存好啦 ✓" : "保存"}
        </button>
      </div>

      {/* 通用设置 */}
      <div className="mt-3 overflow-hidden rounded-[20px] bg-[#FEFCFB] shadow-[var(--shadow-soft-sm)]">
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
              私密空间 5 分钟无操作或切 Tab 自动上锁
            </p>
          </div>
          <Toggle
            on={settings.autoLock ?? true}
            onClick={() => updateSettings({ autoLock: !(settings.autoLock ?? true) })}
          />
        </div>
        <div className="flex items-center justify-between border-t border-[#F6EFEC] px-4 py-3.5 opacity-60">
          <div>
            <p className="text-[14.5px] font-medium text-[#3B2E2A]">深色模式</p>
            <p className="mt-0.5 text-[11.5px] text-[#A8928B]">即将上线</p>
          </div>
          <Toggle on={false} onClick={() => {}} />
        </div>
      </div>

      {/* 数据 */}
      <div className="mt-3 overflow-hidden rounded-[20px] bg-[#FEFCFB] shadow-[var(--shadow-soft-sm)]">
        <button
          onClick={clearCache}
          className="flex w-full items-center justify-between px-4 py-3.5 transition-colors hover:bg-[#FFF8F5]"
        >
          <span className="text-[14.5px] font-medium text-[#3B2E2A]">
            清除本地数据
          </span>
          <span className="text-[12.5px] text-[#C0ABA3]">{sizeLabel}</span>
        </button>
        <button
          onClick={exportData}
          className="flex w-full items-center justify-between border-t border-[#F6EFEC] px-4 py-3.5 transition-colors hover:bg-[#FFF8F5]"
        >
          <span className="text-[14.5px] font-medium text-[#3B2E2A]">
            导出我的数据
          </span>
          <span className="text-[12.5px] text-[#C0ABA3]">备份为 JSON</span>
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
