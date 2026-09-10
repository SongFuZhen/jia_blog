"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Plus } from "lucide-react";
import { Loading } from "@/components/loading";
import { PageHeader } from "@/components/page-header";
import { useFoodStore } from "@/lib/stores/food";
import { compressImage } from "@/lib/image";
import { uploadImage } from "@/lib/upload";
import type { FoodPlatform } from "@/lib/types";
import { FoodCard } from "./food-card";
import { parseShareText } from "@/lib/parse-share";
import { FOOD_TIERS, priceTier } from "@/lib/food-tiers";

const tierFilters = [
  { key: "全部", label: "全部" },
  ...FOOD_TIERS.map((t) => ({ key: t.key, label: t.label })),
];

const platforms: FoodPlatform[] = ["美团", "抖音", "小红书", "其他"];

export default function FoodPage() {
  const { foods, hydrated, hydrate, add } = useFoodStore();
  const [filter, setFilter] = useState<string>("全部");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    platform: FoodPlatform;
    location: string;
    phone: string;
    price: string;
    note: string;
  }>({
    name: "",
    platform: "美团",
    location: "",
    phone: "",
    price: "",
    note: "",
  });
  const [shareText, setShareText] = useState("");

  function handleShare(v: string) {
    setShareText(v);
    const p = parseShareText(v);
    setForm((f) => ({
      ...f,
      name: f.name || p.name || "",
      platform: f.platform || p.platform || "美团",
      location: f.location || p.location || "",
      phone: f.phone || p.phone || "",
    }));
  }
  const [image, setImage] = useState<string | undefined>(undefined);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // 统计
  const stats = useMemo(() => {
    const want = foods.filter((f) => f.status === "want").length;
    const visitedFoods = foods.filter(
      (f) => (f.visits?.length ?? 0) > 0 || f.status === "visited",
    );
    const allVisits = foods.flatMap((f) => f.visits ?? []);
    const rated = allVisits.filter((v) => v.rating);
    const avgRating = rated.length
      ? (rated.reduce((s, v) => s + (v.rating ?? 0), 0) / rated.length).toFixed(1)
      : null;
    const priced = visitedFoods.filter((f) => f.price);
    const avgPrice = priced.length
      ? Math.round(priced.reduce((s, f) => s + (f.price ?? 0), 0) / priced.length)
      : null;
    const repurchase = visitedFoods.filter((f) => f.repurchase).length;

    const totalMeals = foods.reduce((s, f) => s + (f.visits?.length ?? 0), 0);
    const totalSpend = foods.reduce(
      (s, f) => s + (f.visits ?? []).reduce((a, v) => a + (v.cost ?? 0), 0),
      0,
    );

    const platformMap = new Map<string, number>();
    for (const f of foods) {
      if (f.platform) platformMap.set(f.platform, (platformMap.get(f.platform) ?? 0) + 1);
    }
    const platforms = [...platformMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    const maxPlatform = platforms[0]?.[1] ?? 1;

    return {
      want,
      visitedCount: visitedFoods.length,
      avgRating,
      avgPrice,
      repurchase,
      totalMeals,
      totalSpend,
      platforms,
      maxPlatform,
      total: foods.length,
    };
  }, [foods]);

  const filtered =
    filter === "全部"
      ? foods
      : foods.filter((f) => priceTier(f.price)?.key === filter);

  async function handlePick(file: File | undefined) {
    if (!file) return;
    setPicking(true);
    try {
      const compressed = await compressImage(file);
      let url = compressed;
      try {
        url = await uploadImage(compressed, "food");
      } catch {
        // 图床不可用回退 base64
      }
      setImage(url);
    } finally {
      setPicking(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleAdd() {
    if (!form.name.trim() || saving) return;
    setSaving(true);
    try {
      await add({
        name: form.name.trim(),
        platform: form.platform,
        location: form.location.trim() || undefined,
        phone: form.phone.trim() || undefined,
        price: parseFloat(form.price) || undefined,
        note: form.note.trim() || undefined,
        image,
        status: "want",
        createdAt: new Date().toISOString(),
      });
      setForm({ name: "", platform: "美团", location: "", phone: "", price: "", note: "" });
      setShareText("");
      setImage(undefined);
      setShowAdd(false);
    } catch {
      window.alert("保存失败，网络可能不太顺畅，再试一次～");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <PageHeader
        title="美食记录"
        subtitle="把好吃的都记下来"
        action={
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex items-center gap-1 rounded-full bg-[#E96882] px-3.5 py-1.5 text-[12.5px] font-medium text-white shadow-[0_4px_12px_rgba(233,104,130,0.3)] transition-colors hover:bg-[#D56983]"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            收藏美食
          </button>
        }
      />

      {/* 统计 */}
      {foods.length > 0 && (
        <div className="mt-4 rounded-[16px] bg-card p-4 shadow-[var(--shadow-soft-sm)]">
          {/* 累计花费（重要指标，置顶突出） */}
          <div className="flex items-center justify-between rounded-[12px] bg-gradient-to-r from-[#FFE3EA] to-[#FFD0DC] px-4 py-2.5">
            <span className="text-[12px] font-medium text-[#C25B6E]">累计花费</span>
            <span className="text-[20px] font-bold text-[#E0697E]">
              ¥{stats.totalSpend}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            <div className="rounded-[12px] bg-card-warm py-2.5">
              <p className="text-[17px] font-bold text-[#E0697E]">{stats.total}</p>
              <p className="text-[10.5px] text-ink-4">收藏</p>
            </div>
            <div className="rounded-[12px] bg-card-warm py-2.5">
              <p className="text-[17px] font-bold text-orange-ink">{stats.want}</p>
              <p className="text-[10.5px] text-ink-4">想吃</p>
            </div>
            <div className="rounded-[12px] bg-card-warm py-2.5">
              <p className="text-[17px] font-bold text-green-ink">{stats.visitedCount}</p>
              <p className="text-[10.5px] text-ink-4">吃过了</p>
            </div>
            <div className="rounded-[12px] bg-card-warm py-2.5">
              <p className="text-[17px] font-bold text-[#FFC46B]">
                {stats.avgRating ?? "--"}
              </p>
              <p className="text-[10.5px] text-ink-4">平均评分</p>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            <p className="text-[11.5px] text-ink-3">
              共吃了 <b className="text-[#E0697E]">{stats.totalMeals}</b> 顿
              {" · "}回购 {stats.repurchase} 家
            </p>
            {stats.platforms.map(([name, count]) => (
              <div key={name} className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-[11px] text-ink-3">{name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-pink-soft">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FFB4C3] to-[#F16D88]"
                    style={{ width: `${(count / stats.maxPlatform) * 100}%` }}
                  />
                </div>
                <span className="w-5 text-right text-[10.5px] text-ink-4">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 筛选（按人均档次） */}
      <div className="mt-4 flex flex-wrap gap-2">
        {tierFilters.map((tf) => {
          const tierDef =
            tf.key === "全部" ? null : FOOD_TIERS.find((t) => t.key === tf.key);
          const active = filter === tf.key;
          return (
            <button
              key={tf.key}
              onClick={() => setFilter(tf.key)}
              className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                active
                  ? tierDef
                    ? `${tierDef.bg} ${tierDef.text}`
                    : "bg-[#F16D88] text-white"
                  : "bg-white text-ink-3 shadow-[var(--shadow-xs)] dark:bg-card hover:text-[#F16D88]"
              }`}
            >
              {tf.label}
            </button>
          );
        })}
      </div>

      {/* 添加表单 */}
      {showAdd && (
        <div className="mt-3 space-y-3 rounded-[16px] bg-card p-4 shadow-[var(--shadow-soft-sm)]">
          <textarea
            value={shareText}
            onChange={(e) => handleShare(e.target.value)}
            rows={2}
            placeholder="粘贴美团/点评分享文字，自动识别店名·地址·电话"
            className="w-full resize-none rounded-[12px] bg-pink-soft/50 px-3 py-2.5 text-[12.5px] text-ink outline-none"
          />

          {/* 店招牌 1:1（左） + 店名/来源/位置（右）对齐 */}
          <div className="flex gap-3">
            <div className="shrink-0">
              <div
                onClick={() => fileRef.current?.click()}
                className="relative flex h-[112px] w-[112px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[12px] bg-field text-ink-4"
              >
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt="店招牌"
                    className="h-full w-full object-cover"
                  />
                ) : picking ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="size-5" strokeWidth={1.6} />
                    <span className="mt-1 text-[11px]">店招牌</span>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePick(e.target.files?.[0])}
              />
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="店名 / 美食名（必填）"
                className="w-full rounded-[12px] bg-field px-3 py-2 text-[13px] text-ink outline-none"
              />
              <div className="flex flex-wrap gap-1.5">
                {platforms.map((p) => (
                  <button
                    key={p}
                    onClick={() => setForm({ ...form, platform: p as FoodPlatform })}
                    className={`rounded-full px-3 py-1 text-[11px] transition-colors ${
                      form.platform === p
                        ? "bg-pink-soft font-medium text-[#E0697E]"
                        : "bg-cream text-ink-3"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div>
                <p className="px-1 text-[10.5px] text-ink-4">地址</p>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="商圈 / 详细地址"
                  className="w-full rounded-[12px] bg-field px-3 py-2 text-[12px] text-ink outline-none"
                />
              </div>
            </div>
          </div>

          {/* 人均 / 电话 / 链接：图片下方 */}
          <div className="space-y-2">
            {/* 人均（左，与图片等宽）与 电话（右）同一行 */}
            <div className="flex gap-2">
              {/* 人均：带 ¥ 前缀 与 /人 后缀 */}
              <div className="w-[112px] shrink-0">
                <p className="px-1 text-[10.5px] text-ink-4">人均</p>
                <div className="flex items-center rounded-[12px] bg-field px-3">
                  <span className="text-[12px] text-ink-3">¥</span>
                  <input
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^\d.]/g, "") })}
                    placeholder="人均"
                    inputMode="decimal"
                    className="min-w-0 flex-1 bg-transparent px-2 py-2 text-[12px] text-ink outline-none"
                  />
                  <span className="text-[12px] text-ink-3">/人</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="px-1 text-[10.5px] text-ink-4">电话</p>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^\d\-]/g, "") })}
                  placeholder="联系电话"
                  inputMode="tel"
                  className="w-full rounded-[12px] bg-field px-3 py-2 text-[12px] text-ink outline-none"
                />
              </div>
            </div>
          </div>

          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            rows={2}
            placeholder="想吃的理由 / 备注"
            className="w-full resize-none rounded-[12px] bg-field px-3 py-2.5 text-[12.5px] leading-relaxed text-ink outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowAdd(false)}
              className="rounded-full bg-cream px-4 py-1.5 text-[12.5px] text-ink-3"
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              disabled={!form.name.trim() || saving}
              className="rounded-full bg-[#E96882] px-4 py-1.5 text-[12.5px] font-medium text-white disabled:opacity-40"
            >
              {saving ? "保存中…" : "收下"}
            </button>
          </div>
        </div>
      )}

      {/* 列表 */}
      {!hydrated ? (
        <Loading />
      ) : (
        <div className="mt-3 space-y-3">
          {filtered.map((f) => (
            <FoodCard key={f.id} food={f} />
          ))}

          {hydrated && filtered.length === 0 && (
            <p className="mt-8 text-center text-[13px] text-ink-4">
              {filter === "全部" ? "还没有收藏，看到好吃的随手记下来吧" : "这个档次下还没有记录～"}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
