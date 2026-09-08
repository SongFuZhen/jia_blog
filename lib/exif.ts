/**
 * EXIF 提取：手机照片的拍摄时间与 GPS。
 * 用 exifr mini 构建（仅 JPEG），动态 import 使其独立 chunk，不进首屏。
 */
export interface ExifMeta {
  takenAt?: string;
  lat?: number;
  lng?: number;
}

export async function parseExif(file: File): Promise<ExifMeta> {
  try {
    const exifr = await import("exifr/dist/mini.esm.js");
    const data = (await exifr.parse(file, { tiff: true, gps: true })) as {
      DateTimeOriginal?: Date;
      CreateDate?: Date;
      latitude?: number;
      longitude?: number;
    } | undefined;
    if (!data) return {};
    const taken =
      data.DateTimeOriginal ?? data.CreateDate ?? undefined;
    return {
      takenAt: taken ? new Date(taken).toISOString() : undefined,
      lat: typeof data.latitude === "number" ? data.latitude : undefined,
      lng: typeof data.longitude === "number" ? data.longitude : undefined,
    };
  } catch {
    return {}; // HEIC/PNG 等无 EXIF 或解析失败时静默
  }
}
