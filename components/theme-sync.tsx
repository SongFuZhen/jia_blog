"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/lib/stores/settings";

/** 把设置里的暗色开关同步到 <html> 的 .dark 类（默认强制亮色，不跟随系统） */
export function ThemeSync() {
  const dark = useSettingsStore((s) => s.settings.dark);
  const hydrate = useSettingsStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", !!dark);
  }, [dark]);

  return null;
}
