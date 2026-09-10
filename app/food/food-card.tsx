"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { useFoodStore } from "@/lib/stores/food";
import { useRecordsStore } from "@/lib/stores/records";
import { useConfirm } from "@/lib/stores/confirm";
import { compressImage } from "@/lib/image";
import { uploadImage } from "@/lib/upload";
import { parseShareText } from "@/lib/parse-share";
import { nowLocalISO, todayLocal } from "@/lib/time";
import { priceTier } from "@/lib/food-tiers";
import { Sheet } from "@/components/sheet";
import type { Food, FoodPlatform, FoodVisit, Mood } from "@/lib/types";

const platforms: FoodPlatform[] = ["美团", "抖音", "小红书", "其他"];

function today(): string {
  return todayLocal();
}

/** 根据所有就餐记录的评分，计算店铺综合评分 */
function avgVisitRating(visits: FoodVisit[]): number | undefined {
  const rated = visits.filter((v) => v.rating);
  if (rated.length === 0) return undefined;
  const avg = rated.reduce((s, v) => s + (v.rating ?? 0), 0) / rated.length;
  return Math.round(avg * 10) / 10;
}

/** 美食评分 → 日记情绪：1难过 2委屈 3平静 4开心 5幸福（未评分则为 null） */
function ratingToMood(rating?: number): Mood | null {
  switch (rating) {
    case 1:
      return "难过";
    case 2:
      return "委屈";
    case 3:
      return "平静";
    case 4:
      return "开心";
    case 5:
      return "幸福";
    default:
      return null;
  }
}

async function pickImages(files: FileList | null): Promise<string[]> {
  if (!files || files.length === 0) return [];
  const urls: string[] = [];
  for (const file of Array.from(files)) {
    try {
      const compressed = await compressImage(file);
      let url = compressed;
      try {
        url = await uploadImage(compressed, "food");
      } catch {
        // 图床不可用回退 base64
      }
      urls.push(url);
    } catch {
      // 单张失败忽略
    }
  }
  return urls;
}

function Stars({
  value,
  onRate,
  size = "size-3.5",
}: {
  value?: number;
  onRate?: (n: number) => void;
  size?: string;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          onClick={onRate ? () => onRate(n) : undefined}
          className={`${size} ${
            n <= (value ?? 0)
              ? "fill-[#FFC46B] text-[#FFC46B]"
              : "text-[#E8D5CE]"
          }`}
        />
      ))}
    </div>
  );
}

export function FoodCard({ food }: { food: Food }) {
  const { update, remove } = useFoodStore();
  const confirm = useConfirm();

  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editVisitId, setEditVisitId] = useState<string | null>(null);

  // 编辑店信息
  const [ef, setEf] = useState({
    name: food.name,
    platform: (food.platform ?? "美团") as FoodPlatform,
    location: food.location ?? "",
    phone: food.phone ?? "",
    price: food.price != null ? String(food.price) : "",
    note: food.note ?? "",
  });
  const [shareText, setShareText] = useState("");

  function handleShare(v: string) {
    setShareText(v);
    const p = parseShareText(v);
    setEf((f) => ({
      ...f,
      name: f.name || p.name || "",
      platform: f.platform || p.platform || "美团",
      location: f.location || p.location || "",
      phone: f.phone || p.phone || "",
    }));
  }
  const [eImg, setEImg] = useState<string | undefined>(food.image);
  const [ePicking, setEPicking] = useState(false);
  const eFileRef = useRef<HTMLInputElement>(null);

  // 就餐记录表单
  const [vf, setVf] = useState({
    date: today(),
    people: "",
    cost: "",
    feeling: "",
    rating: 0,
    writeDiary: true,
  });
  const [vImgs, setVImgs] = useState<string[]>([]);
  const [vPicking, setVPicking] = useState(false);
  const [vSaving, setVSaving] = useState(false);
  const vFileRef = useRef<HTMLInputElement>(null);

  const visits = food.visits ?? [];
  const visitCount = visits.length;
  const computedRating = avgVisitRating(visits);
  const totalCost = visits.reduce((s, v) => s + (v.cost ?? 0), 0);
  const tier = priceTier(food.price);

  async function handleEImg(file: File | undefined) {
    if (!file) return;
    setEPicking(true);
    try {
      const compressed = await compressImage(file);
      let url = compressed;
      try {
        url = await uploadImage(compressed, "food");
      } catch {}
      setEImg(url);
    } finally {
      setEPicking(false);
      if (eFileRef.current) eFileRef.current.value = "";
    }
  }

  function startEdit() {
    setEf({
      name: food.name,
      platform: (food.platform ?? "美团") as FoodPlatform,
      location: food.location ?? "",
      phone: food.phone ?? "",
      price: food.price != null ? String(food.price) : "",
      note: food.note ?? "",
    });
    setShareText("");
    setEImg(food.image);
    setEditing(true);
  }

  async function saveEdit() {
    if (!ef.name.trim()) return;
    await update(food.id, {
      name: ef.name.trim(),
      platform: ef.platform,
      link: food.link,
      location: ef.location.trim() || undefined,
      phone: ef.phone.trim() || undefined,
      price: parseFloat(ef.price) || undefined,
      note: ef.note.trim() || undefined,
      image: eImg,
    });
    setEditing(false);
  }

  function resetVf() {
    setVf({ date: today(), people: "", cost: "", feeling: "", rating: 0, writeDiary: true });
    setVImgs([]);
    setEditVisitId(null);
  }

  function startEditVisit(v: FoodVisit) {
    setVf({
      date: v.date,
      people: v.people != null ? String(v.people) : "",
      cost: v.cost != null ? String(v.cost) : "",
      feeling: v.feeling ?? "",
      rating: v.rating ?? 0,
      writeDiary: false,
    });
    setVImgs(v.images ?? []);
    setEditVisitId(v.id);
    setAdding(true);
  }

  async function saveVisit() {
    if (vSaving) return;
    setVSaving(true);
    try {
      const base: FoodVisit = {
        id: editVisitId ?? `v_${Date.now()}`,
        date: vf.date || today(),
        people: parseInt(vf.people) || undefined,
        cost: parseFloat(vf.cost) || undefined,
        feeling: vf.feeling.trim() || undefined,
        images: vImgs.length ? vImgs : undefined,
        rating: vf.rating || undefined,
        diaryId: editVisitId
          ? visits.find((v) => v.id === editVisitId)?.diaryId
          : undefined,
        createdAt: editVisitId
          ? visits.find((v) => v.id === editVisitId)?.createdAt ?? nowLocalISO()
          : nowLocalISO(),
      };

      // 联合日记：新增就餐时一键写进日记
      if (vf.writeDiary && !editVisitId) {
        try {
          const records = useRecordsStore.getState();
          await records.hydrate();
          const diary = await records.addRecord({
            type: "diary",
            title: `🍽 ${food.name}`,
            content: [
              vf.cost ? `和 ${base.people ?? "?"} 人吃了 ¥${base.cost}` : "",
              base.feeling ?? "",
            ]
              .filter(Boolean)
              .join("\n"),
            // 没拍就餐照片时，用店招牌（food.image）当作日记头像
            images: vImgs.length ? vImgs : food.image ? [food.image] : [],
            tags: ["美食", food.name],
            visibility: "仅自己",
            // 根据这顿评分自动带出情绪
            mood: ratingToMood(base.rating),
            // 日记时间取「吃饭那天」，而不是记录的今天
            createdAt: base.date + nowLocalISO().slice(10),
          });
          base.diaryId = diary.id;
        } catch {
          // 日记写入失败不影响就餐记录
        }
      }

      if (editVisitId) {
        const changes = {
          date: base.date,
          people: base.people,
          cost: base.cost,
          feeling: base.feeling,
          images: base.images,
          rating: base.rating,
          diaryId: base.diaryId,
        };
        const next = visits.map((v) => (v.id === editVisitId ? { ...v, ...changes } : v));
        await update(food.id, {
          updateVisit: { id: editVisitId, changes },
          status: "visited",
          visitedAt: base.date,
          rating: avgVisitRating(next),
        });
        // 双向同步：就餐照片变化也写回关联的日记，避免两边不一致
        if (base.diaryId) {
          try {
            const recs = useRecordsStore.getState();
            await recs.hydrate();
            await recs.updateRecord(base.diaryId, {
              images: base.images ?? (food.image ? [food.image] : []),
            });
          } catch {
            // 日记同步失败不影响就餐记录
          }
        }
      } else {
        await update(food.id, {
          addVisit: base,
          status: "visited",
          visitedAt: base.date,
          rating: avgVisitRating([...visits, base]),
        });
      }
      resetVf();
      setAdding(false);
      setExpanded(true);
    } finally {
      setVSaving(false);
    }
  }

  async function deleteVisit(id: string) {
    const ok = await confirm({
      title: "删掉这条就餐记录？",
      confirmText: "删除",
      danger: true,
    });
    if (!ok) return;
    const next = visits.filter((v) => v.id !== id);
    await update(food.id, {
      removeVisitId: id,
      status: next.length ? "visited" : "want",
      visitedAt: next[next.length - 1]?.date,
      rating: avgVisitRating(next),
    });
  }

  async function deleteFood() {
    const ok = await confirm({
      title: "删掉这条美食记录？",
      confirmText: "删除",
      danger: true,
    });
    if (ok) remove(food.id);
  }

  const editSheet = editing ? (
    <Sheet title="编辑店铺" onClose={() => setEditing(false)}>
      <div className="space-y-3 pb-2">
        <textarea
          value={shareText}
          onChange={(e) => handleShare(e.target.value)}
          rows={2}
          placeholder="粘贴美团/点评分享文字，自动识别店名·地址·电话"
          className="w-full resize-none rounded-[12px] bg-pink-soft/50 px-3 py-2.5 text-[12.5px] text-ink outline-none"
        />

        {/* 店招牌 1:1（左） + 店名/来源/位置（右）对齐 */}
        <div className="mt-3 flex gap-3">
          <div className="shrink-0">
            <div
              onClick={() => eFileRef.current?.click()}
              className="relative flex h-[112px] w-[112px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[12px] bg-field text-ink-4"
            >
              {eImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={eImg}
                  alt="店招牌"
                  className="h-full w-full object-cover"
                />
              ) : ePicking ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <>
                  <ImagePlus className="size-5" strokeWidth={1.6} />
                  <span className="mt-1 text-[11px]">店招牌</span>
                </>
              )}
            </div>
            <input
              ref={eFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleEImg(e.target.files?.[0])}
            />
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <input
              value={ef.name}
              onChange={(e) => setEf({ ...ef, name: e.target.value })}
              placeholder="店名 / 美食名"
              className="w-full rounded-[12px] bg-field px-3 py-2 text-[13px] text-ink outline-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {platforms.map((p) => (
                <button
                  key={p}
                  onClick={() => setEf({ ...ef, platform: p })}
                  className={`rounded-full px-3 py-1 text-[11px] transition-colors ${
                    ef.platform === p
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
                value={ef.location}
                onChange={(e) => setEf({ ...ef, location: e.target.value })}
                placeholder="商圈 / 详细地址"
                className="w-full rounded-[12px] bg-field px-3 py-2 text-[12px] text-ink outline-none"
              />
            </div>
          </div>
        </div>

        {/* 人均 / 电话 / 链接：图片下方 */}
        <div className="mt-3 space-y-2">
            {/* 人均（左，与图片等宽）与 电话（右）同一行 */}
            <div className="flex gap-2">
              {/* 人均：带 ¥ 前缀 与 /人 后缀 */}
              <div className="w-[112px] shrink-0">
              <p className="px-1 text-[10.5px] text-ink-4">人均</p>
              <div className="flex items-center rounded-[12px] bg-field px-3">
                <span className="text-[12px] text-ink-3">¥</span>
                <input
                  value={ef.price}
                  onChange={(e) =>
                    setEf({ ...ef, price: e.target.value.replace(/[^\d.]/g, "") })
                  }
                  placeholder="人均"
                  inputMode="decimal"
                  className="min-w-0 flex-1 bg-transparent px-2 py-2 text-[12px] text-ink outline-none"
                />
                <span className="text-[12px] text-ink-3">/人</span>
              </div>
            </div>
            {/* 电话 */}
            <div className="min-w-0 flex-1">
              <p className="px-1 text-[10.5px] text-ink-4">电话</p>
              <input
                value={ef.phone}
                onChange={(e) =>
                  setEf({ ...ef, phone: e.target.value.replace(/[^\d\-]/g, "") })
                }
                placeholder="联系电话"
                inputMode="tel"
                className="w-full rounded-[12px] bg-field px-3 py-2 text-[12px] text-ink outline-none"
              />
            </div>
          </div>
        </div>

        <textarea
          value={ef.note}
          onChange={(e) => setEf({ ...ef, note: e.target.value })}
          rows={2}
          placeholder="想吃的理由 / 备注"
          className="mt-3 w-full resize-none rounded-[12px] bg-field px-3 py-2.5 text-[12.5px] leading-relaxed text-ink outline-none"
        />
        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={() => setEditing(false)}
            className="rounded-full bg-cream px-4 py-1.5 text-[12.5px] text-ink-3"
          >
            取消
          </button>
          <button
            onClick={saveEdit}
            disabled={!ef.name.trim()}
            className="rounded-full bg-[#E96882] px-4 py-1.5 text-[12.5px] font-medium text-white disabled:opacity-40"
          >
            保存
          </button>
        </div>
      </div>
    </Sheet>
  ) : null;

  return (
    <>
      <div className="rounded-[16px] bg-card p-4 shadow-[var(--shadow-soft-sm)]">
      <div
        onClick={() => setExpanded((v) => !v)}
        className="flex cursor-pointer gap-3"
      >
        {/* 左：店招牌（无图时显示占位，保持左右布局） */}
        {food.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={food.image}
            alt={food.name}
            className="h-[72px] w-[56px] shrink-0 rounded-[10px] object-cover"
          />
        ) : (
          <div className="flex h-[72px] w-[56px] shrink-0 flex-col items-center justify-center rounded-[10px] bg-field text-ink-4">
            <ImagePlus className="size-5" strokeWidth={1.6} />
          </div>
        )}
        {/* 右：内容 */}
        <div className="min-w-0 flex-1">
          {/* 名称行：名称 + 档次 + 右侧 编辑/删除 */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <h3 className="truncate text-[14.5px] font-semibold text-ink">
                {food.name}
              </h3>
              {tier && (
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${tier.bg} ${tier.text}`}
                >
                  {tier.label}
                </span>
              )}
            </div>
            <div
              className="flex shrink-0 items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEdit();
                }}
                aria-label="编辑"
                className="text-ink-5 hover:text-[#E0697E]"
              >
                <Pencil className="size-3.5" strokeWidth={1.8} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteFood();
                }}
                aria-label="删除"
                className="text-ink-5 hover:text-[#E76F7B]"
              >
                <Trash2 className="size-3.5" strokeWidth={1.8} />
              </button>
            </div>
          </div>
          <p className="mt-0.5 text-[11.5px] text-ink-4">
            {food.platform && `${food.platform} · `}
            {food.location}
            {food.phone ? ` · ${food.phone}` : ""}
            {food.price ? ` · ¥${food.price}/人` : ""}
          </p>
          {food.note && (
            <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-ink-2">
              {food.note}
            </p>
          )}
          {/* 统计行 / 空状态 + 展开箭头 */}
          {visitCount > 0 ? (
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="rounded-full bg-cream px-2 py-1 text-ink-3">
                  共 {visitCount} 次
                </span>
                {totalCost > 0 && (
                  <span className="rounded-full bg-cream px-2 py-1 text-ink-3">
                    总 ¥{totalCost}
                  </span>
                )}
                {computedRating != null && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-cream px-2 py-1 text-orange-ink">
                    综合评分 {computedRating}
                    <Star className="size-3 fill-[#FFC46B] text-[#FFC46B]" />
                  </span>
                )}
              </div>
              <ChevronDown
                className={`size-4 shrink-0 text-ink-4 transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </div>
          ) : (
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-[12px] text-ink-4">还没有就餐记录，加一条吧～</p>
              <ChevronDown
                className={`size-4 shrink-0 text-ink-4 transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </div>
          )}
        </div>
      </div>

      {/* 展开的就餐记录 */}
      {expanded && (
        <div className="mt-3 space-y-2 border-t border-[var(--border-soft)] pt-3">
          {visits
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((v) => (
              <div
                key={v.id}
                className="rounded-[12px] bg-cream/60 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12.5px] font-medium text-ink">
                    {v.date}
                  </span>
                  <div className="flex items-center gap-2">
                    {v.diaryId && (
                      <Link
                        href="/diary"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] text-[#E0697E] hover:underline"
                      >
                        看日记
                      </Link>
                    )}
                    <button
                      onClick={() => startEditVisit(v)}
                      aria-label="编辑就餐"
                      className="text-ink-5 hover:text-[#E0697E]"
                    >
                      <Pencil className="size-3" strokeWidth={1.8} />
                    </button>
                    <button
                      onClick={() => deleteVisit(v.id)}
                      aria-label="删除就餐"
                      className="text-ink-5 hover:text-[#E76F7B]"
                    >
                      <Trash2 className="size-3" strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-[11.5px] text-ink-3">
                  {v.people ? `${v.people} 人` : ""}
                  {v.cost ? ` · 共 ¥${v.cost}` : ""}
                  {v.people && v.cost
                    ? ` · 人均 ¥${Math.round(v.cost / v.people)}`
                    : ""}
                </p>
                {v.rating ? (
                  <div className="mt-1">
                    <Stars value={v.rating} size="size-3" />
                  </div>
                ) : null}
                {v.feeling && (
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-2">
                    {v.feeling}
                  </p>
                )}
                {v.images && v.images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {v.images.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={src}
                        alt=""
                        className="size-14 rounded-[8px] object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

          {/* 加一条 / 编辑就餐表单 */}
          {adding ? (
            <div className="space-y-2 rounded-[12px] bg-field/60 p-3">
              <div className="flex gap-2">
                <input
                  type="date"
                  value={vf.date}
                  onChange={(e) => setVf({ ...vf, date: e.target.value })}
                  className="w-full rounded-[10px] bg-field px-3 py-2 text-[12.5px] text-ink outline-none"
                />
                <input
                  value={vf.people}
                  onChange={(e) =>
                    setVf({ ...vf, people: e.target.value.replace(/[^\d]/g, "") })
                  }
                  placeholder="几个人"
                  inputMode="numeric"
                  className="w-[88px] shrink-0 rounded-[10px] bg-field px-3 py-2 text-[12.5px] text-ink outline-none"
                />
                <input
                  value={vf.cost}
                  onChange={(e) =>
                    setVf({ ...vf, cost: e.target.value.replace(/[^\d.]/g, "") })
                  }
                  placeholder="共 ¥"
                  inputMode="decimal"
                  className="w-[88px] shrink-0 rounded-[10px] bg-field px-3 py-2 text-[12.5px] text-ink outline-none"
                />
              </div>
              <textarea
                value={vf.feeling}
                onChange={(e) => setVf({ ...vf, feeling: e.target.value })}
                rows={2}
                placeholder="这顿的感想～"
                className="w-full resize-none rounded-[10px] bg-field px-3 py-2 text-[12.5px] leading-relaxed text-ink outline-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11.5px] text-ink-4">这顿评分</span>
                <Stars
                  value={vf.rating}
                  size="size-4"
                  onRate={(n) => setVf({ ...vf, rating: n })}
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => vFileRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-[10px] bg-field px-3 py-1.5 text-[12px] text-ink-3"
                >
                  {vPicking ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ImagePlus className="size-4" strokeWidth={1.8} />
                  )}
                  图片
                </button>
                <input
                  ref={vFileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    setVPicking(true);
                    const urls = await pickImages(e.target.files);
                    setVImgs((prev) => [...prev, ...urls]);
                    setVPicking(false);
                    if (vFileRef.current) vFileRef.current.value = "";
                  }}
                />
                {!editVisitId && (
                  <label className="flex items-center gap-1 text-[11.5px] text-ink-4">
                    <input
                      type="checkbox"
                      checked={vf.writeDiary}
                      onChange={(e) =>
                        setVf({ ...vf, writeDiary: e.target.checked })
                      }
                    />
                    同时写进日记
                  </label>
                )}
              </div>
              {vImgs.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {vImgs.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="size-14 rounded-[8px] object-cover"
                    />
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    resetVf();
                    setAdding(false);
                  }}
                  className="rounded-full bg-cream px-4 py-1.5 text-[12.5px] text-ink-3"
                >
                  {editVisitId ? "取消" : "收起"}
                </button>
                <button
                  onClick={saveVisit}
                  disabled={vSaving}
                  className="rounded-full bg-[#E96882] px-4 py-1.5 text-[12.5px] font-medium text-white disabled:opacity-40"
                >
                  {vSaving ? "保存中…" : editVisitId ? "保存" : "记下来"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                resetVf();
                setAdding(true);
              }}
              className="inline-flex w-full items-center justify-center gap-1 rounded-[12px] border border-dashed border-[#E8C3CC] py-2 text-[12.5px] font-medium text-[#E0697E] transition-colors hover:bg-pink-soft/40"
            >
              <Plus className="size-3.5" strokeWidth={2} />
              加一条就餐
            </button>
          )}
        </div>
      )}
      </div>
      {editSheet}
    </>
  );
}
