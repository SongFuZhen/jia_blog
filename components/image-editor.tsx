"use client";

/**
 * 图片编辑器（弹层）：旋转 90°、拖拽裁剪、emoji 贴图、时间/地点水印。
 * 输出合成后的 JPEG dataURL，压缩与重新上传由父组件完成。
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  RotateCw,
  Scissors,
  Loader2,
  X,
} from "lucide-react";
import { loadImage } from "@/lib/image";

type Rect = { x0: number; y0: number; x1: number; y1: number }; // 归一化坐标
type Pt = { x: number; y: number };
type Sticker = { emoji: string; x: number; y: number };

const STICKERS = ["❤️", "🌸", "✨", "🎀", "🐱", "🌞", "🌈", "🍭", "⭐", "☁️"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function formatTime(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function drawWatermark(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  timeStr: string,
  locStr: string,
) {
  const text = [timeStr, locStr].filter(Boolean).join("  ·  ");
  if (!text) return;
  const fs = Math.max(14, Math.round(canvas.height * 0.042));
  ctx.font = `${fs}px sans-serif`;
  const w = ctx.measureText(text).width + fs * 1.6;
  const h = fs * 1.9;
  const x = fs * 0.5;
  const y = canvas.height - h - fs * 0.6;
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, fs * 0.5);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, w, h);
  }
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + fs * 0.8, y + h / 2);
}

export function ImageEditor({
  src,
  takenAt,
  location,
  onCancel,
  onDone,
}: {
  src: string;
  takenAt?: string;
  location?: string;
  onCancel: () => void;
  /** dataUrl 为合成结果（未压缩），location 为用户填写的地点 */
  onDone: (dataUrl: string, location: string | undefined) => void;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [loadErr, setLoadErr] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [mode, setMode] = useState<"view" | "crop">("view");
  const [crop, setCrop] = useState<Rect>({ x0: 0, y0: 0, x1: 1, y1: 1 });
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [activeSticker, setActiveSticker] = useState<string | null>(null);
  const [showTime, setShowTime] = useState(true);
  const [showLoc, setShowLoc] = useState(false);
  const [locText, setLocText] = useState(location ?? "");
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    kind: "move" | "resize" | "new";
    startX: number;
    startY: number;
    orig: Rect;
  } | null>(null);
  const stickerDragRef = useRef<number | null>(null);

  useEffect(() => {
    loadImage(src)
      .then(setImg)
      .catch(() => setLoadErr(true));
  }, [src]);

  // 旋转后的完整图（stageA）
  const rotated = useMemo(() => {
    if (!img) return null;
    const rot = ((rotation % 360) + 360) % 360;
    const swap = rot === 90 || rot === 270;
    const canvas = document.createElement("canvas");
    canvas.width = swap ? img.naturalHeight : img.naturalWidth;
    canvas.height = swap ? img.naturalWidth : img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    return canvas;
  }, [img, rotation]);

  // 裁剪 + 贴图 + 水印后的最终合成（stageB）
  const composed = useMemo(() => {
    if (!rotated) return null;
    const sx = crop.x0 * rotated.width;
    const sy = crop.y0 * rotated.height;
    const sw = Math.max(1, (crop.x1 - crop.x0) * rotated.width);
    const sh = Math.max(1, (crop.y1 - crop.y0) * rotated.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(sw);
    canvas.height = Math.round(sh);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(rotated, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    // 贴图
    const fs = Math.round(canvas.height * 0.14);
    ctx.font = `${fs}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const s of stickers) {
      if (s.x < crop.x0 || s.x > crop.x1 || s.y < crop.y0 || s.y > crop.y1) continue;
      const nx = (s.x - crop.x0) / (crop.x1 - crop.x0);
      const ny = (s.y - crop.y0) / (crop.y1 - crop.y0);
      ctx.fillText(s.emoji, nx * canvas.width, ny * canvas.height);
    }

    // 水印
    drawWatermark(
      ctx,
      canvas,
      showTime && takenAt ? formatTime(takenAt) : "",
      showLoc && locText ? locText : "",
    );
    return canvas;
  }, [rotated, crop, stickers, showTime, showLoc, locText, takenAt]);

  // 渲染到可见 canvas
  useEffect(() => {
    const visible = canvasRef.current;
    if (!visible) return;
    const source = mode === "crop" ? rotated : composed;
    if (!source) return;
    visible.width = source.width;
    visible.height = source.height;
    visible.getContext("2d")?.drawImage(source, 0, 0);
  }, [mode, rotated, composed]);

  function normPoint(e: React.PointerEvent): Pt {
    const rect = (mode === "crop" ? overlayRef : canvasRef).current!.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  }

  // 裁剪框拖拽
  function onCropPointerDown(e: React.PointerEvent) {
    const p = normPoint(e);
    const nearCorner =
      Math.abs(p.x - crop.x1) < 0.12 && Math.abs(p.y - crop.y1) < 0.12;
    const inside =
      p.x >= crop.x0 && p.x <= crop.x1 && p.y >= crop.y0 && p.y <= crop.y1;
    dragRef.current = {
      kind: nearCorner ? "resize" : inside ? "move" : "new",
      startX: p.x,
      startY: p.y,
      orig: { ...crop },
    };
    if (dragRef.current.kind === "new") {
      setCrop({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
    }
    overlayRef.current?.setPointerCapture(e.pointerId);
  }
  function onCropPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const p = normPoint(e);
    const dx = p.x - drag.startX;
    const dy = p.y - drag.startY;
    const o = drag.orig;
    if (drag.kind === "resize") {
      setCrop({ ...o, x1: Math.min(1, Math.max(o.x0 + 0.05, o.x1 + dx)), y1: Math.min(1, Math.max(o.y0 + 0.05, o.y1 + dy)) });
    } else if (drag.kind === "move") {
      const w = o.x1 - o.x0;
      const h = o.y1 - o.y0;
      const x0 = Math.min(1 - w, Math.max(0, o.x0 + dx));
      const y0 = Math.min(1 - h, Math.max(0, o.y0 + dy));
      setCrop({ x0, y0, x1: x0 + w, y1: y0 + h });
    } else {
      setCrop({
        x0: Math.min(drag.startX, p.x),
        y0: Math.min(drag.startY, p.y),
        x1: Math.max(drag.startX, p.x),
        y1: Math.max(drag.startY, p.y),
      });
    }
  }

  // 贴图拖拽/点放
  function onCanvasPointerDown(e: React.PointerEvent) {
    if (!activeSticker || mode !== "view") return;
    const p = normPoint(e);
    const hit = stickers.findIndex(
      (s) => Math.abs(s.x - p.x) < 0.08 && Math.abs(s.y - p.y) < 0.08,
    );
    if (hit >= 0) {
      stickerDragRef.current = hit;
    } else {
      setStickers((prev) => [...prev, { emoji: activeSticker, x: p.x, y: p.y }]);
      stickerDragRef.current = stickers.length;
    }
    canvasRef.current?.setPointerCapture(e.pointerId);
  }
  function onCanvasPointerMove(e: React.PointerEvent) {
    const index = stickerDragRef.current;
    if (index === null) return;
    const p = normPoint(e);
    setStickers((prev) =>
      prev.map((s, i) => (i === index ? { ...s, x: p.x, y: p.y } : s)),
    );
  }

  async function handleDone() {
    if (!composed) return;
    setSaving(true);
    try {
      const dataUrl = composed.toDataURL("image/jpeg", 0.92);
      onDone(dataUrl, showLoc && locText ? locText : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#171114]">
      {/* 顶栏 */}
      <header className="flex items-center justify-between px-4 pt-4 text-white">
        <button onClick={onCancel} aria-label="取消" className="rounded-full bg-white/10 p-2">
          <X className="size-5" strokeWidth={1.8} />
        </button>
        <p className="text-[14px] font-medium">编辑图片</p>
        <button
          onClick={handleDone}
          disabled={saving}
          className="inline-flex items-center gap-1 rounded-full bg-[#E96882] px-4 py-1.5 text-[12.5px] font-medium disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" strokeWidth={2.2} />}
          完成
        </button>
      </header>

      {/* 画布区 */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 py-3">
        {loadErr ? (
          <p className="text-[13px] text-white/70">图片加载失败，请重试</p>
        ) : !img ? (
          <Loader2 className="size-6 animate-spin text-white/70" />
        ) : (
          <div className="relative w-full" style={{ maxHeight: "100%" }}>
            <canvas
              ref={canvasRef}
              onPointerDown={mode === "view" ? onCanvasPointerDown : undefined}
              onPointerMove={mode === "view" ? onCanvasPointerMove : undefined}
              onPointerUp={() => (stickerDragRef.current = null)}
              className="mx-auto max-h-[62vh] w-auto max-w-full rounded-[10px] touch-none"
            />
            {mode === "crop" && (
              <div
                ref={overlayRef}
                onPointerDown={onCropPointerDown}
                onPointerMove={onCropPointerMove}
                onPointerUp={() => (dragRef.current = null)}
                className="absolute inset-0 cursor-crosshair touch-none"
              >
                <div
                  className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]"
                  style={{
                    left: `${crop.x0 * 100}%`,
                    top: `${crop.y0 * 100}%`,
                    width: `${(crop.x1 - crop.x0) * 100}%`,
                    height: `${(crop.y1 - crop.y0) * 100}%`,
                  }}
                >
                  <span className="absolute -bottom-1.5 -right-1.5 size-3.5 rounded-full border-2 border-[#171114] bg-white" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 工具区 */}
      <div className="rounded-t-[20px] bg-[#231B1E] px-4 pb-6 pt-3">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />

        {mode === "crop" ? (
          <div className="flex items-center justify-center gap-3 pb-1">
            <button
              onClick={() => setCrop({ x0: 0, y0: 0, x1: 1, y1: 1 })}
              className="rounded-full bg-white/10 px-4 py-2 text-[12.5px] text-white"
            >
              重置
            </button>
            <button
              onClick={() => setMode("view")}
              className="inline-flex items-center gap-1 rounded-full bg-[#E96882] px-4 py-2 text-[12.5px] font-medium text-white"
            >
              <Check className="size-3.5" strokeWidth={2.2} />
              用这个裁剪
            </button>
          </div>
        ) : (
          <>
            {/* 贴图选择 */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                onClick={() => setActiveSticker(null)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11.5px] ${
                  activeSticker === null ? "bg-[#E96882] text-white" : "bg-white/10 text-white/80"
                }`}
              >
                关闭贴图
              </button>
              {STICKERS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setActiveSticker(emoji)}
                  className={`shrink-0 rounded-full px-2.5 py-1.5 text-[16px] leading-none transition-colors ${
                    activeSticker === emoji ? "bg-[#E96882]" : "bg-white/10"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* 水印 */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowTime((v) => !v)}
                disabled={!takenAt}
                className={`rounded-full px-3 py-1.5 text-[11.5px] disabled:opacity-40 ${
                  showTime && takenAt ? "bg-[#E96882] text-white" : "bg-white/10 text-white/80"
                }`}
              >
                ⏰ 时间水印
              </button>
              <button
                onClick={() => setShowLoc((v) => !v)}
                className={`rounded-full px-3 py-1.5 text-[11.5px] ${
                  showLoc ? "bg-[#E96882] text-white" : "bg-white/10 text-white/80"
                }`}
              >
                📍 地点水印
              </button>
              {showLoc && (
                <input
                  value={locText}
                  onChange={(e) => setLocText(e.target.value)}
                  placeholder="地点名称，如：外滩"
                  className="min-w-0 flex-1 rounded-full bg-white/10 px-3 py-1.5 text-[12px] text-white outline-none placeholder:text-white/40"
                />
              )}
            </div>

            {/* 操作行 */}
            <div className="mt-2.5 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setRotation((r) => r + 90);
                  setCrop({ x0: 0, y0: 0, x1: 1, y1: 1 });
                }}
                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-4 py-2 text-[12.5px] text-white"
              >
                <RotateCw className="size-3.5" strokeWidth={1.8} />
                旋转
              </button>
              <button
                onClick={() => {
                  setMode("crop");
                  setCrop({ x0: 0, y0: 0, x1: 1, y1: 1 });
                }}
                className="inline-flex items-center gap-1 rounded-full bg-white/10 px-4 py-2 text-[12.5px] text-white"
              >
                <Scissors className="size-3.5" strokeWidth={1.8} />
                裁剪
              </button>
              {stickers.length > 0 && (
                <button
                  onClick={() => setStickers([])}
                  className="rounded-full bg-white/10 px-4 py-2 text-[12.5px] text-white/80"
                >
                  清除贴图
                </button>
              )}
            </div>
            <p className="mt-2 text-center text-[10.5px] text-white/40">
              {activeSticker
                ? `已选 ${activeSticker}：点图放置，拖动调整`
                : takenAt
                  ? `拍摄时间 ${formatTime(takenAt)}`
                  : "这张图没有拍摄时间信息"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
