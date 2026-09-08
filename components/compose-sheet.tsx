"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Pencil, X } from "lucide-react";
import { useComposeStore } from "@/lib/stores/ui";
import { useRecordsStore } from "@/lib/stores/records";
import { compressDataUrl, compressImage } from "@/lib/image";
import { uploadImage } from "@/lib/upload";
import { parseExif } from "@/lib/exif";
import { ImageEditor } from "@/components/image-editor";
import type { ImageMeta, Mood, RecordType } from "@/lib/types";

const typeOptions: { value: RecordType; label: string }[] = [
  { value: "diary", label: "写日记" },
  { value: "photo", label: "拍照片" },
  { value: "idea", label: "小想法" },
];

const moods: Mood[] = [
  "开心",
  "幸福",
  "平静",
  "委屈",
  "难过",
  "生气",
  "好困",
  "有成就感",
];

const weathers = ["晴", "多云", "阴", "雨", "雪"];

export function ComposeSheet() {
  const { open, type, closeCompose } = useComposeStore();
  const setType = useComposeStore((s) =>
    s.openCompose,
  );
  const addRecord = useRecordsStore((s) => s.addRecord);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<Mood | null>(null);
  const [weather, setWeather] = useState<string | null>(null);
  const [tags, setTags] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [metas, setMetas] = useState<ImageMeta[]>([]);
  const [busy, setBusy] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const canSave = title.trim().length > 0 || content.trim().length > 0;

  function reset() {
    setTitle("");
    setContent("");
    setMood(null);
    setWeather(null);
    setTags("");
    setImages([]);
    setMetas([]);
  }

  async function handlePickImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const picked = Array.from(files).slice(0, 6 - images.length);
      for (const file of picked) {
        // EXIF（拍摄时间/GPS）要在压缩前提取，压缩会丢掉这些信息
        const exif = await parseExif(file);
        // 压缩 → 上传图床换外链；失败则回退 base64 直存
        const compressed = await compressImage(file);
        let src = compressed;
        try {
          src = await uploadImage(compressed, "records");
        } catch {
          // 图床不可用时静默回退，记录依然可保存
        }
        setImages((prev) => (prev.length >= 6 ? prev : [...prev, src]));
        setMetas((prev) => [
          ...prev,
          {
            url: src,
            takenAt: exif.takenAt ?? new Date().toISOString(),
            lat: exif.lat,
            lng: exif.lng,
          },
        ]);
      }
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  /** 编辑完成：合成图 → 压缩 → 重新上传替换外链，并更新元数据 */
  async function handleEditDone(dataUrl: string, location: string | undefined) {
    if (editIndex === null) return;
    setSavingEdit(true);
    try {
      const compressed = await compressDataUrl(dataUrl);
      let newUrl = compressed;
      try {
        newUrl = await uploadImage(compressed, "records");
      } catch {
        // 上传失败时回退 base64，编辑结果不丢
      }
      setImages((prev) => prev.map((u, i) => (i === editIndex ? newUrl : u)));
      setMetas((prev) =>
        prev.map((m, i) =>
          i === editIndex ? { ...m, url: newUrl, location: location ?? m.location } : m,
        ),
      );
      setEditIndex(null);
    } finally {
      setSavingEdit(false);
    }
  }

  async function save(asDraft: boolean) {
    if (!canSave || busy) return;
    const tagList = tags
      .split(/[\s,，#]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 6);

    try {
      await addRecord({
        type,
        title: title.trim() || "无标题",
        content: content.trim(),
        images,
        imageMeta: images
          .map((u) => metas.find((m) => m.url === u))
          .filter((m): m is ImageMeta => Boolean(m)),
        mood,
        weather: weather ?? undefined,
        tags: tagList,
        visibility: asDraft ? "仅自己" : "私人收藏",
        ...(asDraft ? { draft: true } : {}),
        createdAt: new Date().toISOString(),
      });
    } catch {
      window.alert("网络好像不太顺畅，保存失败了，再试一次～");
      return;
    }
    reset();
    closeCompose();
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
        onClick={closeCompose}
      />
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[430px]">
        <div className="max-h-[86vh] overflow-y-auto rounded-t-[28px] bg-white dark:bg-[#231B1E] px-5 pt-3 pb-6 shadow-[var(--shadow-soft-lg)]">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong" />

          {/* 类型切换 */}
          <div className="flex gap-1.5 rounded-full bg-cream p-1">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setType(opt.value)}
                className={`h-8 flex-1 rounded-full text-[13px] font-medium transition-colors ${
                  type === opt.value
                    ? "bg-white text-[#E0697E] dark:bg-[#342A2E] shadow-[var(--shadow-xs)]"
                    : "text-ink-3"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* 标题 + 正文 */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="起个可爱的标题～"
            className="mt-4 w-full rounded-[14px] bg-field px-3.5 py-2.5 text-[15px] font-medium text-ink outline-none placeholder:text-ink-5"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="今天发生了什么呀？"
            rows={4}
            className="mt-2.5 w-full resize-none rounded-[14px] bg-field px-3.5 py-2.5 text-[13.5px] leading-relaxed text-ink outline-none placeholder:text-ink-5"
          />

          {/* 心情 */}
          <p className="mt-4 text-[12.5px] font-medium text-ink-3">
            现在的心情
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {moods.map((m) => (
              <button
                key={m}
                onClick={() => setMood(mood === m ? null : m)}
                className={`rounded-full px-3 py-1.5 text-[12.5px] transition-colors ${
                  mood === m
                    ? "bg-pink-soft text-[#E0697E] font-medium"
                    : "bg-cream text-ink-3"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* 天气 */}
          <p className="mt-3.5 text-[12.5px] font-medium text-ink-3">
            今天的天气（可跳过）
          </p>
          <div className="mt-2 flex gap-1.5">
            {weathers.map((w) => (
              <button
                key={w}
                onClick={() => setWeather(weather === w ? null : w)}
                className={`rounded-full px-3 py-1.5 text-[12.5px] transition-colors ${
                  weather === w
                    ? "bg-blue-soft text-blue-ink font-medium"
                    : "bg-cream text-ink-3"
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          {/* 图片 */}
          <p className="mt-3.5 text-[12.5px] font-medium text-ink-3">
            贴几张照片（选填）
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {images.map((src, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`照片 ${i + 1}`}
                  className="size-[64px] rounded-[12px] object-cover"
                />
                <button
                  onClick={() => setEditIndex(i)}
                  aria-label="编辑照片"
                  className="absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-full bg-ink/70 text-white"
                >
                  <Pencil className="size-2.5" strokeWidth={2.2} />
                </button>
                <button
                  onClick={() => {
                    setImages((prev) => prev.filter((_, idx) => idx !== i));
                    setMetas((prev) => prev.filter((_, idx) => idx !== i));
                  }}
                  aria-label="移除照片"
                  className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-ink/70 text-white"
                >
                  <X className="size-3" strokeWidth={2.4} />
                </button>
              </div>
            ))}
            {images.length < 6 && (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex size-[64px] items-center justify-center rounded-[12px] bg-field text-ink-5 transition-colors hover:text-[#E0697E]"
                aria-label="添加照片"
              >
                {busy ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <ImagePlus className="size-5" strokeWidth={1.8} />
                )}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handlePickImages(e.target.files)}
            />
          </div>

          {/* 标签 */}
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="标签，空格分隔：日常 美食"
            className="mt-3.5 w-full rounded-[14px] bg-field px-3.5 py-2.5 text-[13px] text-ink outline-none placeholder:text-ink-5"
          />

          {/* 操作 */}
          <div className="mt-5 flex gap-2.5">
            <button
              onClick={() => save(true)}
              disabled={!canSave || busy}
              className="h-11 flex-1 rounded-[14px] bg-cream text-[14.5px] font-medium text-ink-3 transition-colors hover:bg-pink-soft hover:text-[#E0697E] disabled:opacity-50"
            >
              存草稿
            </button>
            <button
              onClick={() => save(false)}
              disabled={!canSave || busy}
              className="h-11 flex-[2] rounded-[14px] bg-[#E96882] text-[14.5px] font-medium text-white shadow-[0_6px_16px_rgba(233,104,130,0.32)] transition-colors hover:bg-[#D56983] disabled:opacity-50"
            >
              记下来
            </button>
          </div>
        </div>
      </div>

      {/* 图片编辑器 */}
      {editIndex !== null && images[editIndex] && (
        <ImageEditor
          src={images[editIndex]}
          takenAt={metas.find((m) => m.url === images[editIndex])?.takenAt}
          location={metas.find((m) => m.url === images[editIndex])?.location}
          onCancel={() => setEditIndex(null)}
          onDone={handleEditDone}
        />
      )}
      {savingEdit && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60">
          <div className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[13px] text-ink">
            <Loader2 className="size-4 animate-spin" />
            正在处理图片…
          </div>
        </div>
      )}
    </div>
  );
}
