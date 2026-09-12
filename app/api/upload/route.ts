import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/server-env";

export const dynamic = "force-dynamic";

// 图床地址为默认值（自建 ImgBed），部署平台只需配 IMGBED_API_TOKEN
const IMGBED_URL =
  serverEnv("IMGBED_URL") ?? "https://cloudflare-imgbed-91r.pages.dev";
const IMGBED_TOKEN = serverEnv("IMGBED_API_TOKEN");
// 上传渠道：经 ImgBed 转发到 HuggingFace（不要 telegram 渠道）。
// 默认 huggingface；若需切回其它渠道（cfr2/s3/discord/webdav）改此环境变量即可。
const IMGBED_CHANNEL = serverEnv("IMGBED_CHANNEL") ?? "huggingface";

const MAX_BYTES = 5 * 1024 * 1024;

/** 图床目录按功能块分类（白名单，防目录乱写） */
const MODULE_FOLDERS: Record<string, string> = {
  records: "jia/records",
  beauty: "jia/beauty",
  inspiration: "jia/inspiration",
  food: "jia/food",
  shows: "jia/shows",
  misc: "jia/misc",
};

/**
 * 图片上传中转：客户端压缩后的 dataURL → 图床（Cloudflare ImgBed）。
 * Token 只存服务端，客户端拿不到。
 */
export async function POST(req: NextRequest) {
  if (!IMGBED_URL || !IMGBED_TOKEN) {
    return NextResponse.json({ error: "图床未配置" }, { status: 500 });
  }

  let dataUrl: unknown;
  let mod: string | undefined;
  try {
    ({ dataUrl, mod } = await req.json());
  } catch {
    return NextResponse.json({ error: "请求体非法" }, { status: 400 });
  }

  const match =
    typeof dataUrl === "string" &&
    dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
  if (!match) {
    return NextResponse.json({ error: "仅支持压缩后的图片" }, { status: 400 });
  }
  const [, mime, base64] = match;
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    return NextResponse.json({ error: "图片超出大小限制" }, { status: 413 });
  }

  // 文件名用 ASCII 安全名，避免图床对中文/多字节名乱码（扩展名按实际格式）
  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(buffer)], { type: mime }),
    `jia-${Date.now()}.${ext}`,
  );

  // 目录按功能块分类，目录不存在时图床自动创建
  const folder = MODULE_FOLDERS[mod ?? ""] ?? MODULE_FOLDERS.misc;

  const res = await fetch(
    `${IMGBED_URL}/upload?uploadFolder=${encodeURIComponent(
      folder,
    )}&uploadChannel=${encodeURIComponent(IMGBED_CHANNEL)}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${IMGBED_TOKEN}` },
      body: form,
      signal: AbortSignal.timeout(60000),
    },
  );
  if (!res.ok) {
    return NextResponse.json(
      { error: `图床上传失败（${res.status}）` },
      { status: 502 },
    );
  }

  const data = await res.json();
  const item = Array.isArray(data) ? data[0] : data;
  const src: string | undefined = item?.publicUrl || item?.src || item?.url || item?.link;
  if (!src || typeof src !== "string") {
    return NextResponse.json({ error: "图床返回异常" }, { status: 502 });
  }
  const url = src.startsWith("http") ? src : new URL(src, IMGBED_URL).toString();
  return NextResponse.json({ url });
}
