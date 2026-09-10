"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { useSettingsStore } from "@/lib/stores/settings";
import { useConfirm } from "@/lib/stores/confirm";
import { useBeautyStore } from "@/lib/stores/beauty";
import { useRecordsStore } from "@/lib/stores/records";
import { dbList, dbClear, isPrivateUnlocked } from "@/lib/repository";
import { DB_COLLECTIONS, PRIVATE_COLLECTIONS } from "@/lib/db-collections";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={on}
      className={`relative h-6.5 w-11 shrink-0 rounded-full transition-colors ${
        on ? "bg-[#F16D88]" : "bg-toggle-off"
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
  const confirm = useConfirm();
  const beautyHydrate = useBeautyStore((s) => s.hydrate);
  const recordsHydrate = useRecordsStore((s) => s.hydrate);

  const [nickname, setNickname] = useState(settings.nickname ?? "");
  const [targetWeight, setTargetWeight] = useState(
    settings.targetWeight ? settings.targetWeight.toFixed(2) : "",
  );
  const [savedFlash, setSavedFlash] = useState(false);
  // 脏标记：用户正在输入某字段时，不回写 store 值，避免切换开关把输入冲掉
  const nicknameDirty = useRef(false);
  const weightDirty = useRef(false);

  useEffect(() => {
    hydrate();
    beautyHydrate();
    recordsHydrate();
  }, [hydrate, beautyHydrate, recordsHydrate]);

  // store 加载/保存完成后，把昵称/目标体重同步进表单（仅在该字段未被用户改动时）
  useEffect(() => {
    if (!nicknameDirty.current) setNickname(settings.nickname ?? "");
  }, [settings.nickname]);

  useEffect(() => {
    if (!weightDirty.current) {
      setTargetWeight(settings.targetWeight ? settings.targetWeight.toFixed(2) : "");
    }
  }, [settings.targetWeight]);

  async function saveProfile() {
    const weight = parseFloat(targetWeight);
    await updateSettings({
      nickname: nickname.trim() || "小佳佳",
      targetWeight: weight ? Math.round(weight * 100) / 100 : undefined,
    });
    nicknameDirty.current = false;
    weightDirty.current = false;
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  async function clearCache() {
    const unlocked = isPrivateUnlocked();
    const ok = await confirm({
      title: "清空全部数据？",
      message: unlocked
        ? "会清掉云端（和本机）的全部记录，含私密空间数据，且无法恢复。"
        : "会清掉云端（和本机）的全部记录（未解锁的私密空间不在此列），且无法恢复。",
      confirmText: "清空",
      danger: true,
    });
    if (!ok) return;

    // 私密解锁前置判断：未解锁时私密集合清不掉，先告知并让用户决定是否仅清其余
    if (!unlocked && PRIVATE_COLLECTIONS.size > 0) {
      const ok2 = await confirm({
        title: "私密空间未解锁",
        message:
          "私密空间（体重记录 / 经期 / 私密日记 / 私密清单）还没解锁，其中的数据不会被清除。仍要清空其余数据吗？",
        confirmText: "仍要清空",
        danger: true,
      });
      if (!ok2) return;
    }

    // 解锁后：私密集合随循环一并清除（dbClear 自动带 x-private-key 头）；
    // 未解锁：私密集合直接跳过，不发起会 401 的请求
    for (const name of DB_COLLECTIONS) {
      if (PRIVATE_COLLECTIONS.has(name) && !unlocked) continue;
      try {
        await dbClear(name);
      } catch {
        // 兜底：仍失败的私密集合跳过，其余照常清除
      }
    }
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith("jia-blog:")) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  }

  async function exportData() {
    const data: Record<string, unknown> = {};
    // 从云端逐集合导出（私密集合需凭证，未解锁时跳过）
    for (const name of DB_COLLECTIONS) {
      if (PRIVATE_COLLECTIONS.has(name)) continue;
      try {
        data[name] = await dbList(name);
      } catch {
        data[name] = null;
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

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <PageHeader title="设置" subtitle="把小站调成喜欢的样子" />

      {/* 个人资料 */}
      <div className="mt-5 space-y-3 rounded-[20px] bg-card p-4 shadow-[var(--shadow-soft-sm)]">
        <div>
          <p className="text-[12.5px] font-medium text-ink-3">你的昵称</p>
          <input
            value={nickname}
            onChange={(e) => {
              nicknameDirty.current = true;
              setNickname(e.target.value);
            }}
            placeholder="小佳佳"
            className="mt-1.5 w-full rounded-[12px] bg-field px-3 py-2.5 text-[13.5px] outline-none"
          />
        </div>
        <div>
          <p className="text-[12.5px] font-medium text-ink-3">体重目标（kg，最多两位小数）</p>
          <input
            value={targetWeight}
            onChange={(e) => {
              weightDirty.current = true;
              setTargetWeight(
                e.target.value
                  .replace(/[^\d.]/g, "")
                  .replace(/(\..*)\./g, "$1")
                  .replace(/(\.\d{2})\d+$/, "$1"),
              );
            }}
            placeholder="49.90"
            inputMode="decimal"
            className="mt-1.5 w-full rounded-[12px] bg-field px-3 py-2.5 text-[13.5px] outline-none"
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
      <div className="mt-3 overflow-hidden rounded-[20px] bg-card shadow-[var(--shadow-soft-sm)]">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div>
            <p className="text-[14.5px] font-medium text-ink">提醒我记录</p>
            <p className="mt-0.5 text-[11.5px] text-ink-4">
              每晚八点，轻轻提醒一下
            </p>
          </div>
          <Toggle
            on={settings.remind ?? true}
            onClick={() => updateSettings({ remind: !(settings.remind ?? true) })}
          />
        </div>
        <div className="flex items-center justify-between border-t border-border-soft px-4 py-3.5">
          <div>
            <p className="text-[14.5px] font-medium text-ink">
              离开时自动上锁
            </p>
            <p className="mt-0.5 text-[11.5px] text-ink-4">
              私密空间 5 分钟无操作或切 Tab 自动上锁
            </p>
          </div>
          <Toggle
            on={settings.autoLock ?? true}
            onClick={() => updateSettings({ autoLock: !(settings.autoLock ?? true) })}
          />
        </div>
        <div className="flex items-center justify-between border-t border-border-soft px-4 py-3.5 opacity-60">
          <div>
            <p className="text-[14.5px] font-medium text-ink">深色模式</p>
            <p className="mt-0.5 text-[11.5px] text-ink-4">
              默认亮色，在夜间换成温柔的暗色
            </p>
          </div>
          <Toggle
            on={!!settings.dark}
            onClick={() => updateSettings({ dark: !settings.dark })}
          />
        </div>
      </div>

      {/* 数据 */}
      <div className="mt-3 overflow-hidden rounded-[20px] bg-card shadow-[var(--shadow-soft-sm)]">
        <button
          onClick={clearCache}
          className="flex w-full items-center justify-between px-4 py-3.5 transition-colors hover:bg-card-hover"
        >
          <span className="text-[14.5px] font-medium text-ink">
            清除全部数据
          </span>
          <span className="text-[12.5px] text-ink-5">含云端与私密</span>
        </button>
        <button
          onClick={exportData}
          className="flex w-full items-center justify-between border-t border-border-soft px-4 py-3.5 transition-colors hover:bg-card-hover"
        >
          <span className="text-[14.5px] font-medium text-ink">
            导出我的数据
          </span>
          <span className="text-[12.5px] text-ink-5">备份为 JSON</span>
        </button>
      </div>

      {/* 关于 */}
      <div className="mt-3 rounded-[20px] bg-card p-5 text-center shadow-[var(--shadow-soft-sm)]">
        <p className="font-display text-[17px] text-ink-3">
          小佳佳的生活日记
        </p>
        <p className="mt-1 text-[12px] text-ink-5">Version 0.1.0</p>
        <p className="font-display mt-3 text-[13.5px] text-ink-5">
          不必很完美 · 只需做自己
        </p>
      </div>
    </main>
  );
}
