"use client";

import { useEffect } from "react";

/** 生产环境注册 Service Worker（开发环境跳过，避免干扰热更新） */
export function PwaRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === "production" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
