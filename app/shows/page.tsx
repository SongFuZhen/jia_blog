"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, ImagePlus, Loader2, Plus, Star, Trash2 } from "lucide-react";
import { Loading } from "@/components/loading";
import { PageHeader } from "@/components/page-header";
import { useShowStore } from "@/lib/stores/show";
import { compressImage } from "@/lib/image";
import { uploadImage } from "@/lib/upload";
import type { ShowType } from "@/lib/types";

const statusFilters = [
  { key: "全部", label: "全部" },
  { key: "want", label: "想看" },
  { key: "visited", label: "看过了" },
] as const;

const showTypes: ShowType[] = ["演唱会", "Livehouse", "音乐节", "话剧", "其他"];

export default function ShowsPage() {
  const { shows, hydrated, hydrate, add, update, remove } = useShowStore();
  const [filter, setFilter] = useState<(typeof statusFilters)[number]["key"]>("全部");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<{
    title: string;
    artist: string;
    type: ShowType;
    venue: string;
    city: string;
    showAt: string;
    price: string;
    link: string;
    note: string;
  }>({
    title: "",
    artist: "",
    type: "演唱会",
    venue: "",
    city: "",
    showAt: "",
    price: "",
    link: "",
    note: "",
  });
  const [image, setImage] = useState<string | undefined>(undefined);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const stats = useMemo(() => {
    const visited = shows.filter((s) => s.status === "visited");
    const priced = shows.filter((s) => s.price);
    return {
      want: shows.filter((s) => s.status === "want").length,
      visitedCount: visited.length,
      thisYear: visited.filter((s) => (s.showAt ?? s.visitedAt ?? "").startsWith(String(new Date().getFullYear()))).length,
      avgPrice: priced.length
        ? Math.round(priced.reduce((sum, s) => sum + (s.price ?? 0), 0) / priced.length)
        : null,
    };
  }, [shows]);

  const filtered =
    filter === "全部" ? shows : shows.filter((s) => s.status === filter);

  async function handlePick(file: File | undefined) {
    if (!file) return;
    setPicking(true);
    try {
      const compressed = await compressImage(file);
      let url = compressed;
      try {
        url = await uploadImage(compressed, "shows");
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
    if (!form.title.trim() || saving) return;
    setSaving(true);
    try {
      await add({
        title: form.title.trim(),
        artist: form.artist.trim() || undefined,
        type: form.type,
        venue: form.venue.trim() || undefined,
        city: form.city.trim() || undefined,
        showAt: form.showAt || undefined,
        price: parseFloat(form.price) || undefined,
        link: form.link.trim() || undefined,
        note: form.note.trim() || undefined,
        image,
        status: "want",
        createdAt: new Date().toISOString(),
      });
      setForm({ title: "", artist: "", type: "演唱会", venue: "", city: "", showAt: "", price: "", link: "", note: "" });
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
      <PageHeader title="演出记录" subtitle="想看的现场，一个别错过" />

      {/* 统计 */}
      {shows.length > 0 && (
        <div className="mt-4 rounded-[16px] bg-card p-4 shadow-[var(--shadow-soft-sm)]">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-[12px] bg-card-warm py-2.5">
              <p className="text-[17px] font-bold text-[#E0697E]">{shows.length}</p>
              <p className="text-[10.5px] text-ink-4">收藏</p>
            </div>
            <div className="rounded-[12px] bg-card-warm py-2.5">
              <p className="text-[17px] font-bold text-orange-ink">{stats.want}</p>
              <p className="text-[10.5px] text-ink-4">想看</p>
            </div>
            <div className="rounded-[12px] bg-card-warm py-2.5">
              <p className="text-[17px] font-bold text-green-ink">{stats.visitedCount}</p>
              <p className="text-[10.5px] text-ink-4">看过了</p>
            </div>
            <div className="rounded-[12px] bg-card-warm py-2.5">
              <p className="text-[17px] font-bold text-[#FFC46B]">{stats.thisYear}</p>
              <p className="text-[10.5px] text-ink-4">今年看过</p>
            </div>
          </div>
          {stats.avgPrice !== null && (
            <p className="mt-3 text-[11.5px] text-ink-3">
              看过的演出平均票价 <b className="text-[#E0697E]">¥{stats.avgPrice}</b>
            </p>
          )}
        </div>
      )}

      {/* 筛选 + 添加 */}
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
          收藏演出
        </button>
      </div>

      {/* 添加表单 */}
      {showAdd && (
        <div className="mt-3 space-y-2 rounded-[16px] bg-card p-4 shadow-[var(--shadow-soft-sm)]">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="演出名称（必填）"
            className="w-full rounded-[12px] bg-field px-3 py-2.5 text-[13px] text-ink outline-none"
          />
          <div className="flex gap-2">
            <input
              value={form.artist}
              onChange={(e) => setForm({ ...form, artist: e.target.value })}
              placeholder="艺人 / 乐队"
              className="w-full rounded-[12px] bg-field px-3 py-2.5 text-[12.5px] text-ink outline-none"
            />
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as ShowType })}
              className="shrink-0 rounded-[12px] bg-field px-3 py-2.5 text-[12.5px] text-ink outline-none"
            >
              {showTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <input
              value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })}
              placeholder="场馆"
              className="w-full rounded-[12px] bg-field px-3 py-2.5 text-[12.5px] text-ink outline-none"
            />
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="城市"
              className="w-full rounded-[12px] bg-field px-3 py-2.5 text-[12.5px] text-ink outline-none"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={form.showAt}
              onChange={(e) => setForm({ ...form, showAt: e.target.value })}
              className="w-full rounded-[12px] bg-field px-3 py-2.5 text-[12.5px] text-ink outline-none"
            />
            <input
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^\d.]/g, "") })}
              placeholder="票价 ¥"
              inputMode="decimal"
              className="w-[96px] shrink-0 rounded-[12px] bg-field px-3 py-2.5 text-[12.5px] text-ink outline-none"
            />
          </div>
          <input
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            placeholder="大麦 / 猫眼链接（选填）"
            className="w-full rounded-[12px] bg-field px-3 py-2.5 text-[12.5px] text-ink outline-none"
          />
          <div className="flex gap-2">
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              rows={2}
              placeholder="备注：想去的理由 / 观后感"
              className="w-full resize-none rounded-[12px] bg-field px-3 py-2.5 text-[12.5px] leading-relaxed text-ink outline-none"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex shrink-0 items-center gap-1 self-start rounded-[12px] bg-field px-3 py-2.5 text-[12px] text-ink-3"
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
              disabled={!form.title.trim() || saving}
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
          {filtered.map((s) => (
            <div
              key={s.id}
              className="rounded-[16px] bg-card p-4 shadow-[var(--shadow-soft-sm)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-[14.5px] font-semibold text-ink">{s.title}</h3>
                  <p className="mt-0.5 text-[11.5px] text-ink-4">
                    {s.type}
                    {s.artist && ` · ${s.artist}`}
                    {s.showAt && ` · ${s.showAt}`}
                  </p>
                  <p className="text-[11.5px] text-ink-4">
                    {[s.venue, s.city].filter(Boolean).join(" · ")}
                    {s.price ? ` · ¥${s.price}` : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-[3px] text-[10.5px] leading-none ${
                    s.status === "want"
                      ? "bg-orange-soft text-orange-ink"
                      : "bg-green-soft text-green-ink"
                  }`}
                >
                  {s.status === "want" ? "想看" : "看过了"}
                </span>
              </div>

              {s.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.image}
                  alt={s.title}
                  className="mt-2 max-h-[140px] w-full rounded-[10px] object-cover"
                />
              )}
              {s.note && (
                <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-ink-2">{s.note}</p>
              )}
              {s.status === "visited" && s.rating ? (
                <div className="mt-1.5 flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      onClick={() => update(s.id, { rating: n })}
                      className={`size-3.5 ${
                        n <= s.rating! ? "fill-[#FFC46B] text-[#FFC46B]" : "text-[#E8D5CE]"
                      }`}
                    />
                  ))}
                </div>
              ) : null}

              <div className="mt-2.5 flex items-center gap-2">
                {s.link && (
                  <a
                    href={s.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-blue-soft px-3 py-1.5 text-[11.5px] font-medium text-blue-ink"
                  >
                    <ExternalLink className="size-3" strokeWidth={2} />
                    购票页
                  </a>
                )}
                <button
                  onClick={() =>
                    update(
                      s.id,
                      s.status === "want"
                        ? {
                            status: "visited",
                            visitedAt: new Date().toISOString().slice(0, 10),
                            showAt: s.showAt || new Date().toISOString().slice(0, 10),
                            rating: s.rating ?? 4,
                          }
                        : { status: "want", rating: undefined, visitedAt: undefined },
                    )
                  }
                  className={`rounded-full px-3 py-1.5 text-[11.5px] font-medium transition-colors ${
                    s.status === "want"
                      ? "bg-pink-soft text-[#E0697E] hover:bg-pink-hover"
                      : "bg-cream text-ink-3"
                  }`}
                >
                  {s.status === "want" ? "看过了！" : "还想看"}
                </button>
                {s.status === "visited" && (
                  <button
                    onClick={() => update(s.id, { repurchase: !s.repurchase })}
                    className={`rounded-full px-3 py-1.5 text-[11.5px] font-medium transition-colors ${
                      s.repurchase ? "bg-[#FFF1E0] text-[#E8853D]" : "bg-cream text-ink-3"
                    }`}
                  >
                    {s.repurchase ? "🧡 还会再看" : "还会再看吗"}
                  </button>
                )}
                <span className="flex-1" />
                <button
                  onClick={() => {
                    if (window.confirm("删掉这条演出记录吗？")) remove(s.id);
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
              {filter === "全部" ? "还没有收藏，刷到想看的演出随手记下来吧" : "这个状态下还没有记录"}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
