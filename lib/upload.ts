/**
 * 图片上传：客户端压缩后的 dataURL → 服务端中转 → 图床。
 * module 决定图床目录分类（records/beauty/inspiration，缺省 misc）。
 * 返回图床外链；失败抛错，由调用方决定兜底（如回退 base64 存储）。
 */
export async function uploadImage(
  dataUrl: string,
  module: "records" | "beauty" | "inspiration" | "food" | "shows" = "records",
): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl, module }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? `上传失败（${res.status}）`);
  }
  const { url } = (await res.json()) as { url: string };
  return url;
}
