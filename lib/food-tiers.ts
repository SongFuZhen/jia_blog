/**
 * 美食「档次」：按人均（price）划分的四档。
 * 阈值可按实际消费习惯调整；档次由人均实时计算，不单独存储，避免与价格不一致。
 */

export type FoodTierKey = "daily" | "treat" | "quality" | "luxury";

export interface FoodTier {
  key: FoodTierKey;
  label: string;
  /** 人均下限（含） */
  min: number;
  /** 人均上限（不含），undefined 表示无上限 */
  max?: number;
  /** 标签文字色 / 背景色 */
  text: string;
  bg: string;
}

export const FOOD_TIERS: FoodTier[] = [
  { key: "daily", label: "日常", min: 0, max: 100, text: "text-[#3F8E5B]", bg: "bg-[#E6F4EA]" },
  { key: "treat", label: "小奢", min: 100, max: 200, text: "text-[#B5791F]", bg: "bg-[#FBEFD8]" },
  { key: "quality", label: "品质", min: 200, max: 400, text: "text-[#C2557A]", bg: "bg-[#FBE5EE]" },
  { key: "luxury", label: "土豪", min: 400, text: "text-[#9A6B1F]", bg: "bg-[#F8E3B0]" },
];

/** 由人均计算档次；无价格时返回 null */
export function priceTier(price?: number): FoodTier | null {
  if (price == null || Number.isNaN(price)) return null;
  for (const t of FOOD_TIERS) {
    if (price >= t.min && (t.max == null || price < t.max)) return t;
  }
  return FOOD_TIERS[FOOD_TIERS.length - 1];
}
