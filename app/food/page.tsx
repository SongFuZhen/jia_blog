"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, ImagePlus, Loader2, Plus, Star, Trash2 } from "lucide-react";
import { Loading } from "@/components/loading";
import { PageHeader } from "@/components/page-header";
import { useFoodStore } from "@/lib/stores/food";
import { compressImage } from "@/lib/image";
import { uploadImage } from "@/lib/upload";
import type { FoodPlatform } from "@/lib/types";

const statusFilters = [
  { key: "全部", label: "全部" },
  { key: "want", label: "想吃" },
  { key: "visited", label: "吃过了" },
] as const;

const platforms: (FoodPlatform | "无")[] = ["大众点评", "美团", "小红书", "其他", "无"];

export default function FoodPage() {
  const { foods, hydrated, hydrate, add, update, remove } = useFoodStore();
  const [filter, setFilter] = useState<(typeof statusFilters)[number]["key"]>("全部");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    platform: FoodPlatform | "无";
    link: string;
    location: string;
    price: string;
    note: string;
  }>({
    name: "",
    platform: "大众点评",
    link: "",
    location: "",
    price: "",
    note: "",
  });
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
    const visited = foods.filter((f) => f.status === "visited");
    const rated = visited.filter((f) => f.rating);
    const avgRating = rated.length
      ? (rated.reduce((s, f) => s + (f.rating ?? 0), 0) / rated.length).toFixed(1)
      : null;
    const priced = visited.filter((f) => f.price);
    const avgPrice = priced.length
      ? Math.round(priced.reduce((s, f) => s + (f.price ?? 0), 0) / priced.length)
      : null;
    const repurchase = visited.filter((f) => f.repurchase).length;
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const thisMonth = visited.filter((f) => f.visitedAt?.startsWith(monthPrefix)).length;

    const platformMap = new Map<string, number>();
    for (const f of foods) {
      if (f.platform) platformMap.set(f.platform, (platformMap.get(f.platform) ?? 0) + 1);
    }
    const platforms = [...platformMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    const maxPlatform = platforms[0]?.[1] ?? 1;

    return {
      want,
      visitedCount: visited.length,
      avgRating,
      avgPrice,
      repurchase,
      thisMonth,
      platforms,
      maxPlatform,
      total: foods.length,
    };
  }, [foods]);

  const filtered =
    filter === "全部" ? foods : foods.filter((f) => f.status === filter);

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
        platform: form.platform === "无" ? undefined : form.platform,
        link: form.link.trim() || undefined,
        location: form.location.trim() || undefined,
        price: parseFloat(form.price) || undefined,
        note: form.note.trim() || undefined,
        image,
        status: "want",
        createdAt: new Date().toISOString(),
      });
      setForm({ name: "", platform: "大众点评", link: "", location: "", price: "", note: "" });
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
      <PageHeader title="美食记录" subtitle="把好吃的都记下来" />

      {/* 统计 */}
      {foods.length > 0 && (
        <div className="mt-4 rounded-[16px] bg-card p-4 shadow-[var(--shadow-soft-sm)]">
          <div className="grid grid-cols-4 gap-2 text-center">
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
              本月吃了 <b className="text-[#E0697E]">{stats.thisMonth}</b> 顿
              {stats.avgPrice !== null && (
                <>
                  {" · "}吃过的店人均 ¥{stats.avgPrice}
                  {" · "}回购 {stats.repurchase} 家
                </>
              )}
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

      {/* 筛选 */}
      <div className="mt-4 flex gap-2">
        {statusFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
              filter === f.key
                ? "bg-[#F16D88] text-white"
                : "bg-white text-ink-3 shadow-[var(--shadow-xs)] dark:bg-card hover:text-[#F16D88]"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="flex-1" />
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full bg-[#E96882] px-3.5 py-1.5 text-[12.5px] font-medium text-white shadow-[0_4px_12px_rgba(233,104,130,0.3)] transition-colors hover:bg-[#D56983]"
        >
          <Plus className="size-3.5" strokeWidth={2} />
          收藏美食
        </button>
      </div>

      {/* 添加表单 */}
      {showAdd && (
        <div className="mt-3 space-y-2 rounded-[16px] bg-card p-4 shadow-[var(--shadow-soft-sm)]">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="店名 / 美食名（必填）"
            className="w-full rounded-[12px] bg-field px-3 py-2.5 text-[13px] text-ink outline-none"
          />
          <div className="flex flex-wrap gap-1.5">
            {platforms.map((p) => (
              <button
                key={p}
                onClick={() => setForm({ ...form, platform: p as FoodPlatform })}
                className={`rounded-full px-3 py-1.5 text-[11.5px] transition-colors ${
                  form.platform === p
                    ? "bg-pink-soft font-medium text-[#E0697E]"
                    : "bg-cream text-ink-3"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <input
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            placeholder="点评 / 美团链接（选填）"
            className="w-full rounded-[12px] bg-field px-3 py-2.5 text-[12.5px] text-ink outline-none"
          />
          <div className="flex gap-2">
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="位置：商圈 / 地址"
              className="w-full rounded-[12px] bg-field px-3 py-2.5 text-[12.5px] text-ink outline-none"
            />
            <input
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^\d.]/g, "") })}
              placeholder="人均 ¥"
              inputMode="decimal"
              className="w-[88px] shrink-0 rounded-[12px] bg-field px-3 py-2.5 text-[12.5px] text-ink outline-none"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex shrink-0 items-center gap-1 rounded-[12px] bg-field px-3 py-2.5 text-[12px] text-ink-3"
            >
              {picking ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" strokeWidth={1.8} />}
              图
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePick(e.target.files?.[0])}
            />
          </div>
          <textarea
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            rows={2}
            placeholder="想吃的理由 / 备注"
            className="w-full resize-none rounded-[12px] bg-field px-3 py-2.5 text-[12.5px] leading-relaxed text-ink outline-none"
          />
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="预览" className="h-20 w-20 rounded-[10px] object-cover" />
          )}
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
            <div
              key={f.id}
              className="rounded-[16px] bg-card p-4 shadow-[var(--shadow-soft-sm)]"
            >
              <div className="flex gap-3">
                {f.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={f.image}
                    alt={f.name}
                    className="size-16 shrink-0 rounded-[12px] object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-[14.5px] font-semibold text-ink">
                      {f.name}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-[3px] text-[10.5px] leading-none ${
                        f.status === "want"
                          ? "bg-orange-soft text-orange-ink"
                          : "bg-green-soft text-green-ink"
                      }`}
                    >
                      {f.status === "want" ? "想吃" : "吃过了"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-ink-4">
                    {f.platform && `${f.platform} · `}
                    {f.location}
                    {f.price ? ` · ¥${f.price}/人` : ""}
                  </p>
                  {f.note && (
                    <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink-2">
                      {f.note}
                    </p>
                  )}
                  {f.status === "visited" && f.rating ? (
                    <div className="mt-1.5 flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          onClick={() => update(f.id, { rating: n })}
                          className={`size-3.5 ${
                            n <= f.rating!
                              ? "fill-[#FFC46B] text-[#FFC46B]"
                              : "text-[#E8D5CE]"
                          }`}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {f.link && (
                    <a
                      href={f.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-blue-soft px-3 py-1.5 text-[11.5px] font-medium text-blue-ink"
                    >
                      <ExternalLink className="size-3" strokeWidth={2} />
                      打开{f.platform ?? "链接"}
                    </a>
                  )}
                  <button
                    onClick={() =>
                      update(
                        f.id,
                        f.status === "want"
                          ? { status: "visited", visitedAt: new Date().toISOString().slice(0, 10), rating: f.rating ?? 4 }
                          : { status: "want", rating: undefined, visitedAt: undefined },
                      )
                    }
                    className={`rounded-full px-3 py-1.5 text-[11.5px] font-medium transition-colors ${
                      f.status === "want"
                        ? "bg-pink-soft text-[#E0697E] hover:bg-pink-hover"
                        : "bg-cream text-ink-3"
                    }`}
                  >
                    {f.status === "want" ? "吃过了！" : "还想吃"}
                  </button>
                  {f.status === "visited" && (
                    <button
                      onClick={() => update(f.id, { repurchase: !f.repurchase })}
                      className={`rounded-full px-3 py-1.5 text-[11.5px] font-medium transition-colors ${
                        f.repurchase
                          ? "bg-[#FFF1E0] text-[#E8853D]"
                          : "bg-cream text-ink-3"
                      }`}
                    >
                      {f.repurchase ? "🧡 会再去" : "还会再去吗"}
                    </button>
                  )}
                </div>
                {f.status === "visited" && f.visitedAt && (
                  <span className="text-[10.5px] text-ink-5">
                    {f.visitedAt} 吃的
                  </span>
                )}
                <button
                  onClick={() => {
                    if (window.confirm("删掉这条美食记录吗？")) remove(f.id);
                  }}
                  aria-label="删除"
                  className="text-ink-5 hover:text-[#E76F7B]"
                >
                  <Trash2 className="size-3.5" strokeWidth={1.8} />
                </button>
              </div>
            </div>
          ))}

          {hydrated && filtered.length === 0 && (
            <p className="mt-8 text-center text-[13px] text-ink-4">
              {filter === "全部" ? "还没有收藏，看到好吃的随手记下来吧" : "这个状态下还没有记录"}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
