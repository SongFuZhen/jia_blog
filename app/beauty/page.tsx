"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Plus, Star } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { useBeautyStore } from "@/lib/stores/beauty";
import type { BeautyCategory } from "@/lib/types";

type Tab = "tips" | "cabinet" | "wish";

const tabs: { key: Tab; label: string }[] = [
  { key: "tips", label: "技巧库" },
  { key: "cabinet", label: "美妆柜" },
  { key: "wish", label: "种草清单" },
];

const categories: (BeautyCategory | "全部")[] = [
  "全部",
  "底妆",
  "眉毛",
  "眼妆",
  "睫毛",
  "腮红",
  "修容",
  "唇妆",
  "卸妆",
  "护肤",
  "发型",
  "穿搭",
];

const categoryColors: Record<BeautyCategory, string> = {
  底妆: "bg-purple-soft text-purple-ink",
  眉毛: "bg-purple-soft text-purple-ink",
  眼妆: "bg-purple-soft text-purple-ink",
  睫毛: "bg-purple-soft text-purple-ink",
  腮红: "bg-pink-soft text-pink-ink",
  修容: "bg-orange-soft text-orange-ink",
  唇妆: "bg-pink-soft text-pink-ink",
  卸妆: "bg-green-soft text-green-ink",
  护肤: "bg-pink-soft text-pink-ink",
  发型: "bg-blue-soft text-blue-ink",
  穿搭: "bg-blue-soft text-blue-ink",
};

const wishStatuses = [
  { key: "want", label: "想买" },
  { key: "bought", label: "已购买" },
  { key: "used", label: "已使用" },
  { key: "notRecommend", label: "不推荐" },
] as const;

const wishStatusColors: Record<string, string> = {
  want: "bg-orange-soft text-orange-ink",
  bought: "bg-purple-soft text-purple-ink",
  used: "bg-green-soft text-green-ink",
  notRecommend: "bg-pink-soft text-pink-ink",
};

export default function BeautyPage() {
  const {
    tips,
    products,
    usageLogs,
    wishes,
    hydrate,
    addProduct,
    removeProduct,
    logUsage,
    addWish,
    updateWish,
    removeWish,
  } = useBeautyStore();
  const [tab, setTab] = useState<Tab>("tips");
  const [category, setCategory] = useState<BeautyCategory | "全部">("全部");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddWish, setShowAddWish] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: "", brand: "", shade: "", favor: 4 });
  const [newWish, setNewWish] = useState("");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const today = new Date().toISOString().slice(0, 10);
  const checkedToday = new Set(
    usageLogs.filter((u) => u.date === today).map((u) => u.productId),
  );

  // 本月最常用 Top5
  const monthPrefix = today.slice(0, 7);
  const monthlyTop = [...usageLogs
    .filter((u) => u.date.startsWith(monthPrefix))
    .reduce((m, u) => m.set(u.productId, (m.get(u.productId) ?? 0) + 1), new Map<string, number>())
    .entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([productId, count]) => ({
      product: products.find((p) => p.id === productId),
      count,
    }))
    .filter((x) => x.product);

  const filteredTips =
    category === "全部" ? tips : tips.filter((t) => t.category === category);

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <PageHeader title="美妆手册" subtitle="变美的路上慢慢走" />

      {/* Tab 切换 */}
      <div className="mt-4 flex gap-1.5 rounded-full bg-cream p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`h-9 flex-1 rounded-full text-[13.5px] font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-[#E0697E] dark:bg-[#342A2E] shadow-[var(--shadow-xs)]"
                : "text-ink-3"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ============ 技巧库 ============ */}
      {tab === "tips" && (
        <>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                  category === c
                    ? "bg-[#F16D88] text-white"
                    : "bg-white text-ink-3 dark:bg-[#2B2225] shadow-[var(--shadow-xs)] hover:text-[#F16D88]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {filteredTips.map((tip) => (
              <Link
                key={tip.id}
                href={`/beauty/${tip.id}`}
                className="block rounded-[16px] bg-card p-4 shadow-[var(--shadow-soft-sm)] transition-shadow hover:shadow-[var(--shadow-soft-md)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-ink">
                    {tip.title}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full px-2 py-[3px] text-[11px] leading-none ${categoryColors[tip.category]}`}
                  >
                    {tip.category}
                  </span>
                </div>
                {tip.scene && (
                  <p className="mt-1 text-[12px] text-ink-2">
                    适合：{tip.scene}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3">
                  <span className="inline-flex items-center gap-0.5 text-[11.5px] text-ink-4">
                    {tip.rating} 分
                    <Star className="size-3 fill-[#FFC46B] text-[#FFC46B]" />
                  </span>
                  {tip.triedAt && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-green-soft px-2 py-[2px] text-[10.5px] text-green-ink">
                      <Check className="size-3" strokeWidth={2.4} />
                      试过 {tip.triedAt.slice(5)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* ============ 美妆柜 ============ */}
      {tab === "cabinet" && (
        <>
          {/* 本月常用 Top5 */}
          {monthlyTop.length > 0 && (
            <div className="mt-4 rounded-[16px] bg-gradient-to-r from-purple-soft to-purple-soft p-4">
              <p className="text-[13px] font-semibold text-purple-ink">
                本月最常用
              </p>
              <ol className="mt-2 space-y-1">
                {monthlyTop.map(({ product, count }, i) => (
                  <li
                    key={product!.id}
                    className="flex items-center justify-between text-[12.5px] text-ink-2"
                  >
                    <span>
                      <span className="mr-1.5 font-bold text-purple-ink">
                        Top{i + 1}
                      </span>
                      {product!.name}
                    </span>
                    <span className="text-[11px] text-ink-4">
                      用了 {count} 次
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <p className="text-[13px] text-ink-4">
              我的产品 · {products.length} 件
            </p>
            <button
              onClick={() => setShowAddProduct((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full bg-[#E96882] px-3.5 py-1.5 text-[12.5px] font-medium text-white shadow-[0_4px_12px_rgba(233,104,130,0.3)]"
            >
              <Plus className="size-3.5" strokeWidth={2} />
              添加产品
            </button>
          </div>

          {showAddProduct && (
            <div className="mt-3 space-y-2 rounded-[16px] bg-card p-4 shadow-[var(--shadow-soft-sm)]">
              <input
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="产品名称（必填）"
                className="w-full rounded-[12px] bg-field px-3 py-2.5 text-[13px] outline-none"
              />
              <div className="flex gap-2">
                <input
                  value={newProduct.brand}
                  onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                  placeholder="品牌"
                  className="w-full rounded-[12px] bg-field px-3 py-2.5 text-[13px] outline-none"
                />
                <input
                  value={newProduct.shade}
                  onChange={(e) => setNewProduct({ ...newProduct, shade: e.target.value })}
                  placeholder="色号"
                  className="w-full rounded-[12px] bg-field px-3 py-2.5 text-[13px] outline-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setNewProduct({ ...newProduct, favor: n })}>
                      <Star
                        className={`size-5 ${
                          n <= newProduct.favor
                            ? "fill-[#FFC46B] text-[#FFC46B]"
                            : "text-toggle-off"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <button
                  onClick={async () => {
                    if (!newProduct.name.trim()) return;
                    await addProduct({
                      name: newProduct.name.trim(),
                      brand: newProduct.brand.trim() || undefined,
                      shade: newProduct.shade.trim() || undefined,
                      favor: newProduct.favor,
                      repurchase: false,
                      boughtAt: today,
                    });
                    setNewProduct({ name: "", brand: "", shade: "", favor: 4 });
                    setShowAddProduct(false);
                  }}
                  className="rounded-full bg-[#E96882] px-3.5 py-1.5 text-[12.5px] font-medium text-white shadow-[0_4px_12px_rgba(233,104,130,0.3)] transition-colors hover:bg-[#D56983]"
                >
                  收进柜子
                </button>
              </div>
            </div>
          )}

          <div className="mt-3 space-y-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="rounded-[16px] bg-card p-4 shadow-[var(--shadow-soft-sm)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-[14.5px] font-semibold text-ink">
                      {p.name}
                    </h3>
                    <p className="mt-0.5 text-[11.5px] text-ink-4">
                      {[p.brand, p.shade].filter(Boolean).join(" · ") || "未填品牌"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`size-3.5 ${
                          n <= p.favor ? "fill-[#FFC46B] text-[#FFC46B]" : "text-toggle-off"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {p.review && (
                  <p className="mt-1.5 text-[12px] text-ink-2">{p.review}</p>
                )}
                <div className="mt-2.5 flex items-center justify-between">
                  {p.repurchase && (
                    <span className="rounded-full bg-green-soft px-2 py-[2px] text-[10.5px] text-green-ink">
                      愿意回购
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => logUsage(p.id)}
                      disabled={checkedToday.has(p.id)}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11.5px] font-medium transition-colors ${
                        checkedToday.has(p.id)
                          ? "bg-green-soft text-green-ink"
                          : "bg-pink-soft text-[#E0697E] hover:bg-pink-hover"
                      }`}
                    >
                      <Check className="size-3" strokeWidth={2.4} />
                      {checkedToday.has(p.id) ? "今天用过了" : "今日打卡"}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm("确定把这件产品移出美妆柜吗？")) removeProduct(p.id);
                      }}
                      className="text-[11.5px] text-ink-5 hover:text-[#E76F7B]"
                    >
                      移出
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ============ 种草清单 ============ */}
      {tab === "wish" && (
        <>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-[13px] text-ink-4">
              想买 → 已购买 → 已使用 → 不推荐
            </p>
            <button
              onClick={() => setShowAddWish((v) => !v)}
              className="inline-flex items-center gap-1 rounded-full bg-[#E96882] px-3.5 py-1.5 text-[12.5px] font-medium text-white shadow-[0_4px_12px_rgba(233,104,130,0.3)]"
            >
              <Plus className="size-3.5" strokeWidth={2} />
              加一项
            </button>
          </div>

          {showAddWish && (
            <div className="mt-3 flex gap-2 rounded-[16px] bg-card p-4 shadow-[var(--shadow-soft-sm)]">
              <input
                value={newWish}
                onChange={(e) => setNewWish(e.target.value)}
                placeholder="想买什么呀？"
                className="w-full rounded-[12px] bg-field px-3 py-2 text-[12.5px] outline-none"
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && newWish.trim()) {
                    await addWish({ name: newWish.trim(), status: "want", createdAt: new Date().toISOString() });
                    setNewWish("");
                    setShowAddWish(false);
                  }
                }}
              />
              <button
                onClick={async () => {
                  if (!newWish.trim()) return;
                  await addWish({ name: newWish.trim(), status: "want", createdAt: new Date().toISOString() });
                  setNewWish("");
                  setShowAddWish(false);
                }}
                className="self-center shrink-0 rounded-full bg-[#E96882] px-3.5 py-1.5 text-[12px] font-medium text-white shadow-[0_4px_12px_rgba(233,104,130,0.3)] transition-colors hover:bg-[#D56983]"
              >
                收下
              </button>
            </div>
          )}

          <div className="mt-3 space-y-3">
            {wishes.map((w) => {
              const statusIndex = wishStatuses.findIndex((s) => s.key === w.status);
              return (
                <div
                  key={w.id}
                  className="rounded-[16px] bg-card p-4 shadow-[var(--shadow-soft-sm)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[14.5px] font-semibold text-ink">
                      {w.name}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-[3px] text-[11px] leading-none ${wishStatusColors[w.status]}`}
                    >
                      {wishStatuses[statusIndex]?.label}
                    </span>
                  </div>
                  {w.note && (
                    <p className="mt-1 text-[12px] text-ink-2">{w.note}</p>
                  )}
                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      {/* 状态流转：点下一个状态 */}
                      {statusIndex < wishStatuses.length - 1 && (
                        <button
                          onClick={() =>
                            updateWish(w.id, { status: wishStatuses[statusIndex + 1].key })
                          }
                          className="rounded-full bg-pink-soft px-3 py-1.5 text-[11.5px] font-medium text-[#E0697E] transition-colors hover:bg-pink-hover"
                        >
                          → {wishStatuses[statusIndex + 1].label}
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => removeWish(w.id)}
                      className="text-[11.5px] text-ink-5 hover:text-[#E76F7B]"
                    >
                      删除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
