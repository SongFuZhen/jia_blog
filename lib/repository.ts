/**
 * 数据仓库抽象层
 *
 * 所有存储读写都收敛在这里，组件与 store 不直接碰 localStorage。
 * 后期接入 Neon（Postgres）时，只需把这些实现替换为 API 调用，
 * 接口签名不变，UI / store 零改动。
 */
import type { Settings, GrowthSection, Food, Show, SecretItem } from "@/lib/types";
import { PRIVATE_COLLECTIONS } from "@/lib/db-collections";
import {
  seedBeautyTips,
  seedFoods,
  seedGrowthSections,
  seedInspirations,
  seedLifeRecords,
  seedPeriodLogs,
  seedPrivateDiaries,
  seedProducts,
  seedSecretItems,
  seedShows,
  seedUsageLogs,
  seedWeightLogs,
  seedWishes,
} from "@/lib/seed";

const STORAGE_PREFIX = "jia-blog";

export interface Entity {
  id: string;
}

/** 集合仓库：接口式 CRUD，全部异步，当前实现为 Neon Postgres（经 /api/db） */
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

/* ---------- 私密集合访问凭证 ---------- */

let privateCredential: string | null = null;

/** 解锁私密空间后设置密码（请求私密集合时作为 x-private-key 头），上锁时清除 */
export function setPrivateCredential(key: string | null) {
  privateCredential = key;
}

function authHeaders(name: string): Record<string, string> {
  return PRIVATE_COLLECTIONS.has(name) && privateCredential
    ? { "x-private-key": privateCredential }
    : {};
}

/* ---------- API 仓库（Neon Postgres） ---------- */

async function api<T>(name: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/db/${name}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(name),
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`数据库请求失败（${res.status}）`);
  return res.json() as Promise<T>;
}

/** 读取迁移前的 localStorage 旧数据 */
function readLocalCollection<T extends Entity>(name: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}:${name}`);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

/**
 * Neon Postgres 实现的集合仓库。
 * 首次 list() 时：云端为空则自动迁移本机 localStorage 数据（无则播种 seed）。
 */
export function createApiRepository<T extends Entity>(
  name: string,
  seed: T[],
): Repository<T> {
  let cache: T[] | null = null;

  const ensure = async (): Promise<T[]> => {
    if (cache) return cache;
    const server = await api<T[]>(name);
    if (server.length === 0) {
      const local = readLocalCollection<T>(name);
      const initial = local.length > 0 ? local : seed;
      if (initial.length > 0) {
        await api(name, {
          method: "POST",
          body: JSON.stringify({ items: initial }),
        });
      }
      cache = initial;
    } else {
      cache = server;
    }
    return cache;
  };

  const write = (items: T[]) => {
    cache = items;
  };

  return {
    async list() {
      const items = await ensure();
      return items.map((item) => ({ ...item }));
    },
    async get(id) {
      const items = await ensure();
      return items.find((item) => item.id === id) ?? null;
    },
    async create(data) {
      const item = { ...data, id: data.id ?? genId() } as T;
      await api(name, { method: "POST", body: JSON.stringify(item) });
      write([item, ...(cache ?? [])]);
      return { ...item };
    },
    async update(id, patch) {
      await ensure();
      const updated = await api<T>(`${name}?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      write((cache ?? []).map((item) => (item.id === id ? updated : item)));
      return { ...updated };
    },
    async remove(id) {
      await ensure();
      const res = await api<{ ok: boolean }>(
        `${name}?id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      write((cache ?? []).filter((item) => item.id !== id));
      return res.ok;
    },
  };
}

/** Neon Postgres 实现的单对象仓库（固定 id 的单行） */
export function createApiSingleRepository<T extends object>(
  name: string,
  defaultValue: T,
): SingleRepository<T> {
  return {
    async load() {
      const items = await api<(T & Entity)[]>(name);
      return items.find((item) => item.id === "default") ?? defaultValue;
    },
    async save(value) {
      await api(name, {
        method: "POST",
        body: JSON.stringify({ ...value, id: "default" }),
      });
    },
  };
}

/* ---------- 各模块仓库实例 ---------- */

export const recordsRepo = createApiRepository("records", seedLifeRecords);
export const beautyTipsRepo = createApiRepository("beauty-tips", seedBeautyTips);
export const productsRepo = createApiRepository("products", seedProducts);
export const usageLogsRepo = createApiRepository("usage-logs", seedUsageLogs);
export const wishesRepo = createApiRepository("wishes", seedWishes);
export const inspirationsRepo = createApiRepository("inspirations", seedInspirations);
export const weightLogsRepo = createApiRepository("weight-logs", seedWeightLogs);
export const periodLogsRepo = createApiRepository("period-logs", seedPeriodLogs);
export const privateDiaryRepo = createApiRepository("private-diary", seedPrivateDiaries);
export const secretItemsRepo = createApiRepository<SecretItem>(
  "secret-list",
  seedSecretItems,
);
export const settingsRepo = createApiSingleRepository<Settings>("settings", {
  nickname: "小佳佳",
  autoLock: true,
  dark: false,
});
export const growthRepo = createApiSingleRepository<GrowthSection[]>(
  "growth-list",
  seedGrowthSections,
);
export const foodsRepo = createApiRepository<Food>("foods", seedFoods);
export const showsRepo = createApiRepository<Show>("shows", seedShows);
