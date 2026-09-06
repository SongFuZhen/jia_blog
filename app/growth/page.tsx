"use client";

import { useMemo, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";

type Item = { id: string; text: string; done: boolean };

const initialSections: { title: string; tone: string; items: Item[] }[] = [
  {
    title: "变美",
    tone: "text-[#E0697E]",
    items: [
      { id: "b1", text: "坚持防晒 30 天", done: true },
      { id: "b2", text: "学会三个新发型", done: true },
      { id: "b3", text: "戒掉奶茶两周", done: false },
      { id: "b4", text: "找到本命口红", done: false },
    ],
  },
  {
    title: "学习",
    tone: "text-[#8B63D9]",
    items: [
      { id: "s1", text: "每天背 20 个单词", done: true },
      { id: "s2", text: "看完一本摄影书", done: false },
      { id: "s3", text: "学会做 PPT 动画", done: false },
    ],
  },
  {
    title: "生活",
    tone: "text-[#4E9A6E]",
    items: [
      { id: "l1", text: "连续早起一周", done: true },
      { id: "l2", text: "整理一次房间", done: true },
      { id: "l3", text: "去野餐一次", done: false },
      { id: "l4", text: "看一次日出", done: false },
    ],
  },
];

export default function GrowthPage() {
  const [sections, setSections] = useState(initialSections);

  const { total, done } = useMemo(() => {
    const all = sections.flatMap((s) => s.items);
    return { total: all.length, done: all.filter((i) => i.done).length };
  }, [sections]);

  function toggle(sectionTitle: string, id: string) {
    setSections((prev) =>
      prev.map((s) =>
        s.title !== sectionTitle
          ? s
          : {
              ...s,
              items: s.items.map((i) =>
                i.id === id ? { ...i, done: !i.done } : i,
              ),
            },
      ),
    );
  }

  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <PageHeader title="成长清单" subtitle="慢慢来，都会实现的" />

      {/* 总进度 */}
      <div className="mt-5 rounded-[20px] bg-gradient-to-r from-[#FEEBEE] to-[#FBE5EC] p-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[14.5px] font-semibold text-[#3B2E2A]">
            <Sparkles className="size-4 text-[#D56983]" strokeWidth={1.8} />
            已完成 {done} / {total} 件小事
          </p>
          <span className="text-[16px] font-bold text-[#D56983]">
            {percent}%
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FFB4C3] to-[#F16D88] transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* 分区清单 */}
      <div className="mt-4 space-y-3">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-[20px] bg-[#FEFCFB] p-4 shadow-[var(--shadow-soft-sm)]"
          >
            <h2
              className={`text-[15px] font-bold ${section.tone}`}
            >
              {section.title}
            </h2>
            <ul className="mt-2.5 space-y-1">
              {section.items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => toggle(section.title, item.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-1.5 py-2 text-left transition-colors hover:bg-[#FFF8F5]"
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        item.done
                          ? "border-[#F16D88] bg-[#F16D88] text-white"
                          : "border-[#E8D5CE] bg-white"
                      }`}
                    >
                      {item.done && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <span
                      className={`text-[14px] ${
                        item.done
                          ? "text-[#C0ABA3] line-through"
                          : "text-[#3B2E2A]"
                      }`}
                    >
                      {item.text}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
