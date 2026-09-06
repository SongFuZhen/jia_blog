import Image from "next/image";
import { Hero } from "@/components/home/hero";
import { PrivateCard } from "@/components/home/private-card";
import { QuickEntries } from "@/components/home/quick-entries";
import { RecentPosts } from "@/components/home/recent-posts";
import { TodaySurprise } from "@/components/home/today-surprise";

export default function Home() {
  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[430px] bg-background">
      <main className="pb-[110px]">
        <Hero />

        {/* 快捷入口轻微压在 Hero 上，与设计稿一致 */}
        <QuickEntries />

        <PrivateCard />

        <TodaySurprise />

        <RecentPosts />

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
