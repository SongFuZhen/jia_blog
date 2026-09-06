"use client";

import { useEffect } from "react";

const IDLE_MS = 5 * 60 * 1000;

/**
 * 私密空间自动锁定：
 * - 5 分钟无操作
 * - 切走 Tab / 最小化
 * 满足任一条件立即调用 onLock。
 */
export function useAutoLock(enabled: boolean, onLock: () => void) {
  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(onLock, IDLE_MS);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") onLock();
    };

    resetTimer();
    window.addEventListener("pointerdown", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("pointermove", resetTimer);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("pointermove", resetTimer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, onLock]);
}
