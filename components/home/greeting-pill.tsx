"use client";

import { useEffect } from "react";
import { useCopyStore } from "@/lib/stores/copy";
import { getGreeting } from "@/lib/surprises";

/** 首屏问候胶囊：文案来自文案库（可在文案编辑页修改） */
export function GreetingPill() {
  const library = useCopyStore((s) => s.library);
  const hydrate = useCopyStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const greeting = getGreeting(library);

  return (
    <div className="absolute top-[8%] right-[5%] rounded-full bg-white/75 px-3.5 py-1.5 text-[11.5px] font-medium text-ink-3 shadow-[var(--shadow-xs)] backdrop-blur-sm dark:bg-[#2B2225]/75">
      {greeting.label} · {greeting.text}
    </div>
  );
}
