/**
 * 图片压缩：目标 80KB 以内（几十 KB）。
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

export async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("图片读取失败"));
    img.src = src;
  });
  return img;
}

/** dataURL 的 base64 部分换算成字节数 */
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

/** 对已加载的图片做迭代压缩，返回 ≤ 目标体积的 JPEG dataURL */
export function compressLoadedImage(img: HTMLImageElement): string {
  let best = drawToDataUrl(img, EDGES[EDGES.length - 1], QUALITIES[QUALITIES.length - 1]);
  for (const edge of EDGES) {
    for (const quality of QUALITIES) {
      const dataUrl = drawToDataUrl(img, edge, quality);
      best = dataUrl;
      if (dataUrlBytes(dataUrl) <= TARGET_BYTES) return dataUrl;
    }
  }
  return best;
}

export async function compressDataUrl(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);
  return compressLoadedImage(img);
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
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    return compressLoadedImage(img);
  } finally {
    URL.revokeObjectURL(url);
  }
}
