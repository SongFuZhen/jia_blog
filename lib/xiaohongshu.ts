import type { LifeRecord } from "@/lib/types";

/**
 * 小红书文案生成（P1：模板拼接，非 AI）。
 * 后续 P2 接 LLM 时替换此实现即可。
 */
export function generateXhsContent(record: LifeRecord): string {
  const lines: string[] = [];

  lines.push(`🌸 ${record.title}`);
  lines.push("");
  if (record.content) {
    lines.push(record.content);
    lines.push("");
  }

  const meta: string[] = [];
  if (record.mood) meta.push(`今日心情：${record.mood}`);
  if (record.weather) meta.push(`天气：${record.weather}`);
  if (record.location) meta.push(`坐标：${record.location}`);
  if (meta.length > 0) {
    lines.push(`—  ${meta.join(" / ")}`);
    lines.push("");
  }

  const tags = [...record.tags];
  if (record.mood) tags.push(record.mood);
  tags.push("日常记录", "生活日记", "小确幸");
  lines.push(tags.map((t) => `#${t}`).join(" "));

  return lines.join("\n");
}
