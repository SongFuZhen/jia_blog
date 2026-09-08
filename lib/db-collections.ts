/**
 * 数据库集合注册表（客户端/服务端共用）。
 * 服务端按 allowlist 校验集合名，私密集合需密码头。
 */
export const DB_COLLECTIONS = [
  "records",
  "beauty-tips",
  "products",
  "usage-logs",
  "wishes",
  "inspirations",
  "weight-logs",
  "period-logs",
  "private-diary",
  "secret-list",
  "settings",
  "growth-list",
  "foods",
  "shows",
] as const;

export type DbCollection = (typeof DB_COLLECTIONS)[number];

/** 私密集合：接口访问需携带 x-private-key（服务端与 PRIVATE_PASSWORD 比对） */
export const PRIVATE_COLLECTIONS: ReadonlySet<string> = new Set([
  "weight-logs",
  "period-logs",
  "private-diary",
  "secret-list",
]);

export function isDbCollection(name: string): name is DbCollection {
  return (DB_COLLECTIONS as readonly string[]).includes(name);
}
