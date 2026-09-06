import Image from "next/image";
import { Heart } from "lucide-react";

export function Hero() {
  return (
    <section className="relative">
      <Image
        src="/images/hero.png"
        alt="窗边打盹的猫咪与郁金香"
        width={853}
        height={441}
        priority
        className="w-full"
      />

      {/* 抽离出来的手写文案（随屏幕宽度流式缩放） */}
      <div className="absolute top-[24%] left-[5%]">
        <h1 className="font-display text-[clamp(21px,6.3vw,27px)] leading-[1.45] text-[#5A4238]">
          做更喜欢
          <br />
          自己的女孩
          <Heart
            className="ml-1 inline size-4 -translate-y-1.5 fill-[#F8C9D4] text-[#F191A6]"
            strokeWidth={1.8}
          />
        </h1>

        <div className="font-display relative mt-3.5 inline-block text-[clamp(11px,3.2vw,14px)] leading-[1.8] text-[#8A6F63]">
          “生活很琐碎，
          <br />
          但我依然热爱。”
          {/* 粉色手绘下划线 */}
          <svg
            className="absolute right-1 -bottom-1 h-[4px] w-[80%]"
            viewBox="0 0 80 4"
            fill="none"
            preserveAspectRatio="none"
          >
            <path
              d="M2 2.8C22 1 58 1 78 2.2"
              stroke="#F5B8C4"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* 照片底边模糊过渡：越往下越模糊，柔化边界 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 backdrop-blur-lg [mask-image:linear-gradient(to_bottom,transparent,black)]" />

      {/* 向下延伸的同色渐变，增加 Hero 高度并融入页面底色 */}
      <div className="h-28 bg-gradient-to-b from-[#FAF3F0] to-background" />
    </section>
  );
}
