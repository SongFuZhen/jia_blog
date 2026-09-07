import { ChevronRight, Heart, Lock } from "lucide-react";
import Image from "next/image";

export function PrivateCard() {
  return (
    <section className="mt-2 px-6">
      <div className="relative flex overflow-hidden rounded-[20px] bg-gradient-to-r from-pink-soft to-pink-soft-2 shadow-[var(--shadow-soft-sm)]">
        {/* 左侧信封插画 + 右缘模糊过渡 */}
        <div className="relative w-[96px] shrink-0">
          <Image
            src="/images/envelope.png"
            alt="Only for you"
            width={271}
            height={185}
            className="h-full w-full object-cover"
          />
          {/* 右缘模糊：越靠右越模糊 */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 backdrop-blur-[3px] [mask-image:linear-gradient(to_left,black,transparent)]" />
          {/* 右缘渐变融入卡片底色 */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-r from-transparent to-pink-soft" />
        </div>

        {/* 右上角装饰爱心 */}
        <Heart className="absolute top-3 right-12 size-3.5 fill-[#F5B8C4] text-[#F5B8C4]" strokeWidth={1.8} />
        <Heart className="absolute top-6 right-5 size-2.5 fill-[#F7CBD4] text-[#F7CBD4]" strokeWidth={1.8} />

        {/* 内容 */}
        <div className="flex min-w-0 flex-1 flex-col py-3.5 pr-4 pl-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#D56983] text-white">
              <Lock className="size-4" strokeWidth={2} />
            </span>
            <h2 className="text-[15px] font-bold text-ink">专属私密空间</h2>
          </div>
          <p className="mt-1.5 text-[12.5px] font-medium text-ink-2">
            体重 · 经期 · 更多属于你的小秘密
          </p>
          <p className="mt-0.5 text-[11px] text-ink-4">
            需要输入密码才能查看哦～
          </p>

          {/* 去解锁按钮：右下角 */}
          <div className="mt-2 flex justify-end">
            <a
              href="/private"
              className="inline-flex h-8 items-center gap-0.5 rounded-full bg-[#D56983] px-4 text-[12.5px] font-medium text-white shadow-[0_4px_10px_rgba(213,105,131,0.3)] transition-colors hover:bg-pink-ink"
            >
              去解锁
              <ChevronRight className="size-3.5" strokeWidth={2.2} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
