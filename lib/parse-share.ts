import type { FoodPlatform } from "./types";

export interface ParsedShare {
  name?: string;
  platform?: FoodPlatform;
  link?: string;
  location?: string;
  phone?: string;
}

const PLATFORM_HINTS: { re: RegExp; platform: FoodPlatform }[] = [
  { re: /美团|大众点评|点评/, platform: "美团" },
  { re: /小红书/, platform: "小红书" },
  { re: /抖音/, platform: "抖音" },
];

const DOMAIN_MAP: { re: RegExp; platform: FoodPlatform }[] = [
  { re: /meituan\./, platform: "美团" },
  { re: /dianping\.|dpurl\./, platform: "美团" },
  { re: /xiaohongshu\.|xhslink\./, platform: "小红书" },
  { re: /douyin\./, platform: "抖音" },
];

/**
 * 解析美团/大众点评/小红书等分享文字，提取店名、地址、电话、来源、链接。
 * 例：「【上井精致料理（西宸天街店）】快来试试…【地址：…】【电话：…】@美团 http://dpurl.cn/xxx」
 * 结构较规整时正则即可；若需更强能力可后续接 AI 分析。
 */
export function parseShareText(text: string): ParsedShare {
  const result: ParsedShare = {};
  if (!text?.trim()) return result;

  const nameMatch = text.match(/【([^】]+)】/);
  if (nameMatch) result.name = nameMatch[1].trim();

  const addrMatch = text.match(/地址[:：]\s*([^】]+)/);
  if (addrMatch) result.location = addrMatch[1].trim();

  const phoneMatch = text.match(/电话[:：]\s*([\d\-]{5,})/);
  if (phoneMatch) result.phone = phoneMatch[1].trim();

  const linkMatch = text.match(/https?:\/\/[^\s）)]+/);
  if (linkMatch) result.link = linkMatch[0].trim();

  for (const h of PLATFORM_HINTS) {
    if (h.re.test(text)) {
      result.platform = h.platform;
      break;
    }
  }
  if (!result.platform && result.link) {
    for (const d of DOMAIN_MAP) {
      if (d.re.test(result.link)) {
        result.platform = d.platform;
        break;
      }
    }
  }

  return result;
}
