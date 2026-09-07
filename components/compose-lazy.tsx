"use client";

import dynamic from "next/dynamic";

// 快速记录编辑器：点 + 才需要，从首屏共享 bundle 拆出，点击时按需加载
const ComposeSheet = dynamic(
  () => import("@/components/compose-sheet").then((m) => m.ComposeSheet),
  { ssr: false },
);

export function ComposeLazy() {
  return <ComposeSheet />;
}
