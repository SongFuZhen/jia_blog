"use client";

import { Loader2 } from "lucide-react";

/** 页面数据加载中的轻提示 */
export function Loading({ text = "加载中…" }: { text?: string }) {
  return (
    <div className="mt-10 flex flex-col items-center text-[#A8928B]">
      <Loader2 className="size-5 animate-spin" strokeWidth={1.8} />
      <p className="mt-2 text-[12.5px]">{text}</p>
    </div>
  );
}
