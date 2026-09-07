/**
 * 图片压缩：手机照片（常见 3-8MB）→ 目标 80KB 以内（几十 KB）。
 * 策略：逐级降尺寸（1280 → 960 → 720）× 逐级降质量（0.7 → 0.35），
 * 第一个达标的结果直接返回；全部尝试后返回能压到的最小结果。
 * 用 HTMLImageElement 解码，浏览器会自动应用 EXIF 旋转信息。
 */

/** 目标体积（字节）：几十 KB */
const TARGET_BYTES = 80 * 1024;

/** 长边逐级收缩 */
const EDGES = [1280, 960, 720];

/** 质量逐级下降 */
const QUALITIES = [0.7, 0.55, 0.45, 0.35];

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("图片读取失败"));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** dataURL 的 base64 部分换算成字节数（去掉 data:image/jpeg;base64, 前缀） */
function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Math.round(base64.length * 0.75);
}

function drawToDataUrl(
  img: HTMLImageElement,
  edge: number,
  quality: number,
): string {
  const scale = Math.min(1, edge / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 不可用");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function compressImage(file: File): Promise<string> {
  // 原图已经足够小，直接原样转存
  if (file.size <= TARGET_BYTES) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("图片读取失败"));
      reader.readAsDataURL(file);
    });
  }

  const img = await loadImage(file);
  let best = drawToDataUrl(img, EDGES[EDGES.length - 1], QUALITIES[QUALITIES.length - 1]);

  for (const edge of EDGES) {
    for (const quality of QUALITIES) {
      const dataUrl = drawToDataUrl(img, edge, quality);
      best = dataUrl; // 越往后越小，始终记住最小结果兜底
      if (dataUrlBytes(dataUrl) <= TARGET_BYTES) {
        return dataUrl;
      }
    }
  }
  return best;
}
