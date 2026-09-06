/**
 * 数据仓库抽象层
 *
 * 所有存储读写都收敛在这里，组件与 store 不直接碰 localStorage。
 * 后期接入 Neon（Postgres）时，只需把这些实现替换为 API 调用，
 * 接口签名不变，UI / store 零改动。
 */
import type {
  BeautyTip,
  Inspiration,
  LifeRecord,
  PeriodLog,
  PrivateDiary,
  Product,
  Settings,
  UsageLog,
  WeightLog,
  Wish,
} from "@/lib/types";
import {
  seedBeautyTips,
  seedInspirations,
  seedLifeRecords,
  seedPeriodLogs,
  seedPrivateDiaries,
  seedProducts,
  seedUsageLogs,
  seedWeightLogs,
  seedWishes,
} from "@/lib/seed";

const STORAGE_PREFIX = "jia-blog";

export interface Entity {
  id: string;
}

/** 集合仓库：接口式 CRUD，全部异步（为 API 化预留） */
export interface Repository<T extends Entity> {
  list(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  create(data: Omit<T, "id"> & { id?: string }): Promise<T>;
  update(id: string, patch: Partial<Omit<T, "id">>): Promise<T | null>;
  remove(id: string): Promise<boolean>;
}

/** 单对象仓库（如设置） */
export interface SingleRepository<T> {
  load(): Promise<T>;
  save(value: T): Promise<void>;
}

export function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** localStorage 实现的集合仓库；首次访问时写入 seed 数据 */
export function createLocalRepository<T extends Entity>(
  name: string,
  seed: T[],
): Repository<T> {
  const key = `${STORAGE_PREFIX}:${name}`;
  let cache: T[] | null = null;

  const read = (): T[] => {
    if (cache) return cache;
    if (typeof window === "undefined") return seed;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) {
        cache = seed.map((item) => ({ ...item }));
        window.localStorage.setItem(key, JSON.stringify(cache));
      } else {
        cache = JSON.parse(raw) as T[];
      }
    } catch {
      cache = seed.map((item) => ({ ...item }));
    }
    return cache;
  };

  const write = (items: T[]) => {
    cache = items;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, JSON.stringify(items));
    }
  };

  return {
    async list() {
      return read().map((item) => ({ ...item }));
    },
    async get(id) {
      return read().find((item) => item.id === id) ?? null;
    },
    async create(data) {
      const item = { ...data, id: data.id ?? genId() } as T;
      write([item, ...read()]);
      return { ...item };
    },
    async update(id, patch) {
      const items = read();
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) return null;
      items[index] = { ...items[index], ...patch };
      write(items);
      return { ...items[index] };
    },
    async remove(id) {
      const items = read();
      const next = items.filter((item) => item.id !== id);
      if (next.length === items.length) return false;
      write(next);
      return true;
    },
  };
}

/** localStorage 实现的单对象仓库 */
export function createLocalSingleRepository<T>(
  name: string,
  defaultValue: T,
): SingleRepository<T> {
  const key = `${STORAGE_PREFIX}:${name}`;
  let cache: T | null = null;

  return {
    async load() {
      if (cache) return cache;
      if (typeof window === "undefined") return defaultValue;
      try {
        const raw = window.localStorage.getItem(key);
        cache = raw === null ? defaultValue : (JSON.parse(raw) as T);
      } catch {
        cache = defaultValue;
      }
      return cache;
    },
    async save(value) {
      cache = value;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    },
  };
}

/* ---------- 各模块仓库实例 ---------- */

export const recordsRepo = createLocalRepository<LifeRecord>(
  "records",
  seedLifeRecords,
);
export const beautyTipsRepo = createLocalRepository<BeautyTip>(
  "beauty-tips",
  seedBeautyTips,
);
export const productsRepo = createLocalRepository<Product>(
  "products",
  seedProducts,
);
export const usageLogsRepo = createLocalRepository<UsageLog>(
  "usage-logs",
  seedUsageLogs,
);
export const wishesRepo = createLocalRepository<Wish>("wishes", seedWishes);
export const inspirationsRepo = createLocalRepository<Inspiration>(
  "inspirations",
  seedInspirations,
);
export const weightLogsRepo = createLocalRepository<WeightLog>(
  "weight-logs",
  seedWeightLogs,
);
export const periodLogsRepo = createLocalRepository<PeriodLog>(
  "period-logs",
  seedPeriodLogs,
);
export const privateDiaryRepo = createLocalRepository<PrivateDiary>(
  "private-diary",
  seedPrivateDiaries,
);
export const settingsRepo = createLocalSingleRepository<Settings>(
  "settings",
  { nickname: "小佳佳", autoLock: true },
);
