import Image from "next/image";
import { Hero } from "@/components/home/hero";
import { PrivateCard } from "@/components/home/private-card";
import { QuickEntries } from "@/components/home/quick-entries";
import { TodaySurprise } from "@/components/home/today-surprise";
import { UpcomingDays } from "@/components/home/upcoming-days";

export default function Home() {
  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[430px] bg-background">
      <main className="pb-[110px]">
        <Hero />

        {/* 快捷入口轻微压在 Hero 上，与设计稿一致 */}
        <QuickEntries />

        {/* 今日小惊喜 + 今日待办，与快捷入口同一组 */}
        <TodaySurprise />

        {/* 未来一个月的重要日子（传统节日 + 生日 + 纪念日） */}
        <UpcomingDays />

        {/* 专属私密空间（放在最后） */}
        <PrivateCard />

        {/* 页脚手写标语（取自设计稿） */}
        <footer className="mt-6 pb-2 flex justify-center">
          <Image
            src="/images/footer.png"
            alt="不必很完美 · 只需做自己"
            width={565}
            height={49}
            className="w-[240px]"
          />
        </footer>
      </main>
    </div>
  );
}
