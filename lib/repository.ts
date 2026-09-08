/**
 * 数据仓库抽象层
 *
 * 所有存储读写都收敛在这里，组件与 store 不直接碰 localStorage。
 * 后期接入 Neon（Postgres）时，只需把这些实现替换为 API 调用，
 * 接口签名不变，UI / store 零改动。
 */
import type {
  Settings,
  GrowthSection,
  Food,
  Show,
  SecretItem,
  LifeRecord,
  BeautyTip,
  Product,
  UsageLog,
  Wish,
  Inspiration,
  WeightLog,
  PeriodLog,
  PrivateDiary,
  CopyLibrary,
} from "@/lib/types";
import { PRIVATE_COLLECTIONS } from "@/lib/db-collections";
import { DEFAULT_COPY_LIBRARY } from "@/lib/surprises";

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

/**
 * Neon Postgres 实现的集合仓库。
 * 数据以云端为唯一来源；localStorage 迁移期已结束，不再自动播种/回流。
 */
export function createApiRepository<T extends Entity>(
  name: string,
): Repository<T> {
  let cache: T[] | null = null;

  const ensure = async (): Promise<T[]> => {
    if (cache) return cache;
    cache = await api<T[]>(name);
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

export const recordsRepo = createApiRepository<LifeRecord>("records");
export const beautyTipsRepo = createApiRepository<BeautyTip>("beauty-tips");
export const productsRepo = createApiRepository<Product>("products");
export const usageLogsRepo = createApiRepository<UsageLog>("usage-logs");
export const wishesRepo = createApiRepository<Wish>("wishes");
export const inspirationsRepo = createApiRepository<Inspiration>("inspirations");
export const weightLogsRepo = createApiRepository<WeightLog>("weight-logs");
export const periodLogsRepo = createApiRepository<PeriodLog>("period-logs");
export const privateDiaryRepo = createApiRepository<PrivateDiary>("private-diary");
export const secretItemsRepo = createApiRepository<SecretItem>("secret-list");
export const settingsRepo = createApiSingleRepository<Settings>("settings", {
  nickname: "小佳佳",
  autoLock: true,
  remind: true,
  dark: false,
});
export const growthRepo = createApiSingleRepository<GrowthSection[]>(
  "growth-list",
  [
    {
      title: "变美",
      tone: "text-[#E0697E]",
      items: [
        { id: "b1", text: "坚持防晒 30 天", done: true },
        { id: "b2", text: "学会三个新发型", done: true },
        { id: "b3", text: "戒掉奶茶两周", done: false },
        { id: "b4", text: "找到本命口红", done: false },
      ],
    },
    {
      title: "学习",
      tone: "text-[#8B63D9]",
      items: [
        { id: "s1", text: "每天背 20 个单词", done: true },
        { id: "s2", text: "看完一本摄影书", done: false },
        { id: "s3", text: "学会做 PPT 动画", done: false },
      ],
    },
    {
      title: "生活",
      tone: "text-[#4E9A6E]",
      items: [
        { id: "l1", text: "连续早起一周", done: true },
        { id: "l2", text: "整理一次房间", done: true },
        { id: "l3", text: "去野餐一次", done: false },
        { id: "l4", text: "看一次日出", done: false },
      ],
    },
  ],
);
export const foodsRepo = createApiRepository<Food>("foods");
export const showsRepo = createApiRepository<Show>("shows");
export const copyRepo = createApiSingleRepository<CopyLibrary>(
  "copy-library",
  DEFAULT_COPY_LIBRARY,
);
