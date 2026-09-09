"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, ImagePlus, Loader2, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Loading } from "@/components/loading";
import { PageHeader } from "@/components/page-header";
import { useShowStore } from "@/lib/stores/show";
import { useConfirm } from "@/lib/stores/confirm";
import { useRecordsStore } from "@/lib/stores/records";
import { compressImage } from "@/lib/image";
import { uploadImage } from "@/lib/upload";
import { nowLocalISO, todayLocal } from "@/lib/time";
import type { Show, ShowType } from "@/lib/types";

const showTypes: ShowType[] = ["演唱会", "Livehouse", "音乐节", "话剧", "其他"];

export default function ShowsPage() {
  const { shows, hydrated, hydrate, add, update, remove } = useShowStore();
  const confirm = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    title: string;
    artist: string;
    type: ShowType;
    venue: string;
    city: string;
    showAt: string;
    price: string;
    people: string;
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
    people: "",
    link: "",
    note: "",
  });
  const [image, setImage] = useState<string | undefined>(undefined);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [writeDiary, setWriteDiary] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const stats = useMemo(() => {
    const priced = shows.filter((s) => s.price);
    const withPeople = shows.filter((s) => s.price && s.people);
    const year = String(new Date().getFullYear());
    return {
      total: shows.length,
      thisYear: shows.filter((s) => (s.showAt ?? "").startsWith(year)).length,
      repurchase: shows.filter((s) => s.repurchase).length,
      avgPrice: priced.length
        ? Math.round(priced.reduce((sum, s) => sum + (s.price ?? 0), 0) / priced.length)
        : null,
      totalSpend: withPeople.reduce(
        (sum, s) => sum + (s.price ?? 0) * (s.people ?? 0),
        0,
      ),
    };
  }, [shows]);

  // 按演出日期（缺省用创建时间）倒序，最近的在前
  const list = useMemo(
    () =>
      [...shows].sort((a, b) =>
        (b.showAt ?? b.createdAt).localeCompare(a.showAt ?? a.createdAt),
      ),
    [shows],
  );

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

  function resetForm() {
    setForm({
      title: "",
      artist: "",
      type: "演唱会",
      venue: "",
      city: "",
      showAt: "",
      price: "",
      people: "",
      link: "",
      note: "",
    });
    setImage(undefined);
    setWriteDiary(true);
    setEditingId(null);
  }

  function startEdit(s: Show) {
    setForm({
      title: s.title,
      artist: s.artist ?? "",
      type: s.type,
      venue: s.venue ?? "",
      city: s.city ?? "",
      showAt: s.showAt ?? "",
      price: s.price != null ? String(s.price) : "",
      people: s.people != null ? String(s.people) : "",
      link: s.link ?? "",
      note: s.note ?? "",
    });
    setImage(s.image);
    setEditingId(s.id);
    setWriteDiary(false);
    setShowForm(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function handleSave() {
    if (!form.title.trim() || saving) return;
    setSaving(true);
    try {
      const showData = {
        title: form.title.trim(),
        artist: form.artist.trim() || undefined,
        type: form.type,
        venue: form.venue.trim() || undefined,
        city: form.city.trim() || undefined,
        showAt: form.showAt || undefined,
        price: parseFloat(form.price) || undefined,
        people: parseInt(form.people) || undefined,
        link: form.link.trim() || undefined,
        note: form.note.trim() || undefined,
        image,
      };

      if (editingId) {
        await update(editingId, showData);
      } else {
        await add({ ...showData, createdAt: nowLocalISO() });
        // 添加完成后可顺手生成一条日记，按演出当天记录
        if (writeDiary) {
          try {
            const records = useRecordsStore.getState();
            await records.hydrate();
            await records.addRecord({
              type: "diary",
              title: `🎫 ${showData.title}`,
              content: [
                showData.artist ? `艺人：${showData.artist}` : "",
                `类型：${showData.type}`,
                [showData.venue, showData.city].filter(Boolean).join(" · "),
                showData.price ? `单价 ¥${showData.price}/人` : "",
                showData.people ? `人数 ${showData.people}` : "",
                showData.price && showData.people
                  ? `共 ¥${showData.price * showData.people}`
                  : "",
                showData.note ?? "",
              ]
                .filter(Boolean)
                .join("\n"),
              images: image ? [image] : [],
              mood: null,
              tags: ["演出", showData.title],
              visibility: "仅自己",
              createdAt: (showData.showAt || todayLocal()) + nowLocalISO().slice(10),
            });
          } catch {
            // 日记写入失败不影响演出记录
          }
        }
      }
      resetForm();
      setShowForm(false);
    } catch {
      window.alert("保存失败，网络可能不太顺畅，再试一次～");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[430px] bg-background px-6 pb-32">
      <PageHeader title="演出记录" subtitle="看过的现场，都记下来" />

      {/* 统计 */}
      {shows.length > 0 && (
        <div className="mt-4 rounded-[16px] bg-card p-4 shadow-[var(--shadow-soft-sm)]">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-[12px] bg-card-warm py-2.5">
              <p className="text-[17px] font-bold text-[#E0697E]">{stats.total}</p>
              <p className="text-[10.5px] text-ink-4">总记录</p>
            </div>
            <div className="rounded-[12px] bg-card-warm py-2.5">
              <p className="text-[17px] font-bold text-orange-ink">{stats.thisYear}</p>
              <p className="text-[10.5px] text-ink-4">今年</p>
            </div>
            <div className="rounded-[12px] bg-card-warm py-2.5">
              <p className="text-[17px] font-bold text-[#FFC46B]">
                {stats.avgPrice != null ? `¥${stats.avgPrice}` : "—"}
              </p>
              <p className="text-[10.5px] text-ink-4">人均票价</p>
            </div>
            <div className="rounded-[12px] bg-card-warm py-2.5">
              <p className="text-[17px] font-bold text-green-ink">
                {stats.totalSpend ? `¥${stats.totalSpend}` : "—"}
              </p>
              <p className="text-[10.5px] text-ink-4">累计花费</p>
            </div>
          </div>
          {stats.repurchase > 0 && (
            <p className="mt-2 text-[11.5px] text-ink-3">还会再看 {stats.repurchase} 场</p>
          )}
        </div>
      )}

      {/* 添加 */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => {
            resetForm();
            setShowForm((v) => !v);
          }}
          className="inline-flex items-center gap-1 rounded-full bg-[#E96882] px-3.5 py-1.5 text-[12.5px] font-medium text-white shadow-[0_4px_12px_rgba(233,104,130,0.3)] transition-colors hover:bg-[#D56983]"
        >
          <Plus className="size-3.5" strokeWidth={2} />
          {showForm && !editingId ? "收起" : "记一场演出"}
        </button>
      </div>

      {/* 添加 / 编辑表单 */}
      {showForm && (
        <div className="mt-3 space-y-2 rounded-[16px] bg-card p-4 shadow-[var(--shadow-soft-sm)]">
          <p className="text-[13px] font-semibold text-ink">
            {editingId ? "编辑演出" : "记一场演出"}
          </p>
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
          <div className="flex gap-2">
            <input
              type="date"
              value={form.showAt}
              onChange={(e) => setForm({ ...form, showAt: e.target.value })}
              className="w-full rounded-[12px] bg-field px-3 py-2.5 text-[12.5px] text-ink outline-none"
            />
            <input
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: e.target.value.replace(/[^\d.]/g, "") })
              }
              placeholder="单价 ¥"
              inputMode="decimal"
              className="w-[88px] shrink-0 rounded-[12px] bg-field px-3 py-2.5 text-[12.5px] text-ink outline-none"
            />
            <input
              value={form.people}
              onChange={(e) =>
                setForm({ ...form, people: e.target.value.replace(/[^\d]/g, "") })
              }
              placeholder="人数"
              inputMode="numeric"
              className="w-[76px] shrink-0 rounded-[12px] bg-field px-3 py-2.5 text-[12.5px] text-ink outline-none"
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
              placeholder="备注：观后感 / 想聊的"
              className="w-full resize-none rounded-[12px] bg-field px-3 py-2.5 text-[12.5px] leading-relaxed text-ink outline-none"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex shrink-0 items-center gap-1 self-start rounded-[12px] bg-field px-3 py-2.5 text-[12px] text-ink-3"
            >
              {picking ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" strokeWidth={1.8} />
              )}
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
            <img
              src={image}
              alt="预览"
              className="h-20 w-20 rounded-[10px] object-cover"
            />
          )}
          {!editingId && (
            <label className="flex w-fit items-center gap-1.5 text-[11.5px] text-ink-4">
              <input
                type="checkbox"
                checked={writeDiary}
                onChange={(e) => setWriteDiary(e.target.checked)}
              />
              同时写进日记
            </label>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="rounded-full bg-cream px-4 py-1.5 text-[12.5px] text-ink-3"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!form.title.trim() || saving}
              className="rounded-full bg-[#E96882] px-4 py-1.5 text-[12.5px] font-medium text-white disabled:opacity-40"
            >
              {saving ? "保存中…" : editingId ? "保存" : "收下"}
            </button>
          </div>
        </div>
      )}

      {/* 列表 */}
      {!hydrated ? (
        <Loading />
      ) : (
        <div className="mt-3 space-y-3">
          {list.map((s) => (
            <div
              key={s.id}
              className="rounded-[16px] bg-card p-4 shadow-[var(--shadow-soft-sm)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-[14.5px] font-semibold text-ink">
                    {s.title}
                  </h3>
                  <p className="mt-0.5 text-[11.5px] text-ink-4">
                    {s.type}
                    {s.artist && ` · ${s.artist}`}
                    {s.showAt && ` · ${s.showAt}`}
                  </p>
                  <p className="text-[11.5px] text-ink-4">
                    {[s.venue, s.city].filter(Boolean).join(" · ")}
                    {s.price ? ` · ¥${s.price}/人` : ""}
                    {s.people ? ` · ${s.people}人` : ""}
                    {s.price && s.people ? ` · 共 ¥${s.price * s.people}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    onClick={() => startEdit(s)}
                    aria-label="编辑"
                    className="text-ink-5 hover:text-[#E0697E]"
                  >
                    <Pencil className="size-3.5" strokeWidth={1.8} />
                  </button>
                  <button
                    onClick={async () => {
                      const ok = await confirm({
                        title: "删掉这条演出记录？",
                        confirmText: "删除",
                        danger: true,
                      });
                      if (ok) remove(s.id);
                    }}
                    aria-label="删除"
                    className="text-ink-5 hover:text-[#E76F7B]"
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.8} />
                  </button>
                </div>
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
                <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-ink-2">
                  {s.note}
                </p>
              )}

              {/* 评分 */}
              <div className="mt-1.5 flex items-center gap-1">
                <span className="text-[11px] text-ink-4">评分</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    onClick={() => update(s.id, { rating: n })}
                    className={`size-3.5 ${
                      n <= (s.rating ?? 0)
                        ? "fill-[#FFC46B] text-[#FFC46B]"
                        : "text-[#E8D5CE]"
                    }`}
                  />
                ))}
              </div>

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
                  onClick={() => update(s.id, { repurchase: !s.repurchase })}
                  className={`rounded-full px-3 py-1.5 text-[11.5px] font-medium transition-colors ${
                    s.repurchase
                      ? "bg-[#FFF1E0] text-[#E8853D]"
                      : "bg-cream text-ink-3"
                  }`}
                >
                  {s.repurchase ? "🧡 还会再看" : "还会再看吗"}
                </button>
              </div>
            </div>
          ))}

          {hydrated && list.length === 0 && (
            <p className="mt-8 text-center text-[13px] text-ink-4">
              还没有演出记录，看过的现场随手记下来吧
            </p>
          )}
        </div>
      )}
    </main>
  );
}
