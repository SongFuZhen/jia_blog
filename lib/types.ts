/**
 * 全局数据类型定义
 * 与 docs/功能规划.md「五、数据模型草案」保持一致。
 * 日期约定：date-only 字段用 "YYYY-MM-DD"，createdAt 用 ISO 字符串。
 */

/** 心情（8 选 1） */
export type Mood =
  | "开心"
  | "幸福"
  | "平静"
  | "委屈"
  | "难过"
  | "生气"
  | "好困"
  | "有成就感";

/** 记录类型：日记 / 照片 / 想法 */
export type RecordType = "diary" | "photo" | "idea";

/** 可见范围工作流：仅自己 → 私人收藏 → 准备分享 → 已发布 */
export type Visibility = "仅自己" | "私人收藏" | "准备分享" | "已发布";

/** 日常记录（日记/照片/想法共用） */
export interface LifeRecord {
  id: string;
  type: RecordType;
  title: string;
  content: string;
  images: string[];
  mood: Mood | null;
  weather?: string;
  location?: string;
  tags: string[];
  visibility: Visibility;
  /** 草稿：未写完的记录，只出现在「我的草稿」，不进正常日记流 */
  draft?: boolean;
  createdAt: string;
}

/** 美妆技巧分类 */
export type BeautyCategory =
  | "底妆"
  | "眉毛"
  | "眼妆"
  | "睫毛"
  | "腮红"
  | "修容"
  | "唇妆"
  | "卸妆"
  | "护肤"
  | "发型"
  | "穿搭";

/** 美妆技巧 */
export interface BeautyTip {
  id: string;
  category: BeautyCategory;
  title: string;
  cover?: string;
  steps: string[];
  products: string[];
  notes?: string;
  scene?: string;
  /** 我的评价 1-5 星 */
  rating: number;
  /** 「我试过了」 */
  triedAt?: string;
  triedEffect?: number;
  nextAdjust?: string;
}

/** 美妆柜产品 */
export interface Product {
  id: string;
  name: string;
  brand?: string;
  shade?: string;
  price?: number;
  image?: string;
  boughtAt?: string;
  review?: string;
  /** 喜欢程度 1-5 */
  favor: number;
  repurchase: boolean;
}

/** 产品使用打卡 */
export interface UsageLog {
  id: string;
  productId: string;
  date: string;
}

/** 种草清单状态流转：想买 → 已购买 → 已使用 → 不推荐 */
export type WishStatus = "want" | "bought" | "used" | "notRecommend";

export interface Wish {
  id: string;
  name: string;
  image?: string;
  note?: string;
  status: WishStatus;
  createdAt: string;
}

/** 灵感收藏类型 */
export type InspirationType =
  | "妆容"
  | "穿搭"
  | "发型"
  | "家居"
  | "美食"
  | "摄影"
  | "文案"
  | "笔记";

export interface Inspiration {
  id: string;
  type: InspirationType;
  image?: string;
  content: string;
  tags: string[];
  createdAt: string;
}

/** 私密空间：体重记录 */
export interface WeightLog {
  id: string;
  date: string;
  weight: number;
  note?: string;
}

/** 私密空间：经期记录（个人记录与周期回顾，非医疗诊断） */
export interface PeriodLog {
  id: string;
  start: string;
  end?: string;
  symptoms: string[];
  feeling?: string;
  note?: string;
}

/** 私密空间：私密日记（与普通日记完全隔离） */
export interface PrivateDiary {
  id: string;
  date: string;
  content: string;
  mood?: Mood;
}

/** 我的（设置） */
export interface Settings {
  nickname: string;
}
