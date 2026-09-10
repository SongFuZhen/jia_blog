export interface ParsedShow {
  title?: string;
  showAt?: string;
  venue?: string;
  city?: string;
  price?: number;
  note?: string;
}

function toISODate(s: string): string | undefined {
  const m = s.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (!m) return undefined;
  const y = m[1];
  const mo = m[2].padStart(2, "0");
  const d = m[3].padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

/**
 * 从粘贴的演出详情里识别字段，格式如：
 * 🎵 2025年「消磨时间」巡演·成都站
 * 演出时间：2025年3月22日 20:00
 * 演出场地：成都 正火艺术中心1号馆（梵木创艺区）
 * 门票价格：280元
 * 演出详情：……
 */
export function parseShowText(text: string): ParsedShow {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const result: ParsedShow = {};

  // 标题：取第一行，去掉开头的 emoji / 装饰符号
  if (lines.length > 0) {
    result.title =
      lines[0].replace(/^[^\u4e00-\u9fffA-Za-z0-9(（]+/, "").trim() ||
      lines[0];
  }

  for (const line of lines.slice(1)) {
    const kv = line.match(/^(.+?)[:：]\s*(.+)$/);
    if (!kv) continue;
    const key = kv[1];
    const val = kv[2].trim();
    if (key.includes("时间")) {
      result.showAt = toISODate(val) ?? result.showAt;
    } else if (key.includes("场地")) {
      const idx = val.indexOf(" ");
      if (idx > -1) {
        result.city = val.slice(0, idx).trim();
        result.venue = val.slice(idx + 1).trim();
      } else {
        result.venue = val;
      }
    } else if (key.includes("价格") || key.includes("票")) {
      const m = val.match(/(\d+(\.\d+)?)/);
      if (m) result.price = parseFloat(m[1]);
    } else if (
      key.includes("详情") ||
      key.includes("介绍") ||
      key.includes("亮点") ||
      key.includes("备注")
    ) {
      result.note = val;
    }
  }

  return result;
}
