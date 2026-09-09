"use client";

import { UpcomingDaysCard } from "@/components/upcoming-days-card";

/** 首页「未来一个月重要日子」+ 倒计时 */
export function UpcomingDays() {
  return (
    <section className="mt-5 px-6">
      <UpcomingDaysCard moreHref="/important-days" />
    </section>
  );
}
