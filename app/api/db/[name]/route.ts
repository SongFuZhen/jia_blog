import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { isDbCollection, PRIVATE_COLLECTIONS } from "@/lib/db-collections";
import { serverEnv } from "@/lib/server-env";

export const dynamic = "force-dynamic";

// 惰性初始化：构建时环境变量可能尚未注入，首次请求才创建连接
let _sql: ReturnType<typeof neon> | null = null;
function getSql(): (
  strings: TemplateStringsArray,
  ...params: unknown[]
) => Promise<Record<string, unknown>[]> {
  if (!_sql) {
    const url = serverEnv("DATABASE_URL");
    if (!url) {
      throw new Error("DATABASE_URL 未配置");
    }
    _sql = neon(url);
  }
  return _sql as (
    strings: TemplateStringsArray,
    ...params: unknown[]
  ) => Promise<Record<string, unknown>[]>;
}

/** 校验集合名与私密访问凭证；返回错误响应或 null */
function guard(req: NextRequest, name: string): NextResponse | null {
  if (!isDbCollection(name)) {
    return NextResponse.json({ error: "unknown collection" }, { status: 404 });
  }
  if (PRIVATE_COLLECTIONS.has(name)) {
    const expected = serverEnv("PRIVATE_PASSWORD");
    const key = req.headers.get("x-private-key");
    if (!expected || key !== expected) {
      return NextResponse.json({ error: "locked" }, { status: 401 });
    }
  }
  return null;
}

// GET /api/db/[name] → 集合全部数据
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const denied = guard(req, name);
  if (denied) return denied;

  const rows = await getSql()`SELECT data FROM jia.collections WHERE name = ${name}`;
  return NextResponse.json(rows.map((r) => r.data));
}

// POST /api/db/[name]：body 为单个实体，或 { items: [...] } 批量迁移/播种
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const denied = guard(req, name);
  if (denied) return denied;

  const body = await req.json();
  const items: unknown[] = Array.isArray(body?.items) ? body.items : [body];

  for (const item of items) {
    const { id, ...data } = item as { id?: string };
    if (!id) {
      return NextResponse.json({ error: "missing id" }, { status: 400 });
    }
    await getSql()`
      INSERT INTO jia.collections (name, id, data, updated_at)
      VALUES (${name}, ${id}, ${JSON.stringify({ ...data, id })}::jsonb, now())
      ON CONFLICT (name, id) DO UPDATE
      SET data = EXCLUDED.data, updated_at = now()
    `;
  }
  return NextResponse.json({ ok: true, count: items.length });
}

// PATCH /api/db/[name]?id=xxx：body 为部分字段，jsonb 浅合并
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const denied = guard(req, name);
  if (denied) return denied;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const patch = await req.json();

  // 就餐记录（visits）用增量操作，避免客户端缓存覆盖服务端已有的条目
  const rows0 = await getSql()`SELECT data FROM jia.collections WHERE name = ${name} AND id = ${id}`;
  if (rows0.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const base: Record<string, unknown> =
    (rows0[0].data as Record<string, unknown>) ?? {};
  let visits = Array.isArray(base.visits) ? (base.visits as Record<string, unknown>[]) : [];
  let usedDelta = false;
  if (patch.addVisit) {
    visits = [...visits, patch.addVisit];
    usedDelta = true;
  }
  if (patch.updateVisit) {
    visits = visits.map((v: Record<string, unknown>) =>
      v.id === patch.updateVisit.id ? { ...v, ...patch.updateVisit.changes } : v,
    );
    usedDelta = true;
  }
  if (patch.removeVisitId) {
    visits = visits.filter((v: Record<string, unknown>) => v.id !== patch.removeVisitId);
    usedDelta = true;
  }

  const rest = { ...patch };
  delete rest.addVisit;
  delete rest.updateVisit;
  delete rest.removeVisitId;

  // 图片保护：PATCH 携带的图片为 undefined（调用方未提供图片）时，
  // 不要覆盖服务端已有的图片，避免陈旧缓存整体回写把图片抹掉。
  // 显式传 null 仍视为「清空图片」，不受保护。
  if (rest.image === undefined) {
    rest.image = base.image as string | undefined;
  }

  // usedDelta 时以服务端 visits 为准；否则保持原浅合并行为
  const finalData = usedDelta
    ? { ...base, ...rest, visits }
    : { ...base, ...rest };

  const rows = await getSql()`
    UPDATE jia.collections
    SET data = ${JSON.stringify(finalData)}::jsonb, updated_at = now()
    WHERE name = ${name} AND id = ${id}
    RETURNING data
  `;
  return NextResponse.json(rows[0].data);
}

// DELETE /api/db/[name]?id=xxx
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const denied = guard(req, name);
  if (denied) return denied;

  const id = req.nextUrl.searchParams.get("id");

  // 不带 id：清空整个集合（用于「清除全部数据」）
  if (!id) {
    await getSql()`DELETE FROM jia.collections WHERE name = ${name}`;
    return NextResponse.json({ ok: true, cleared: true });
  }

  const rows = await getSql()`
    DELETE FROM jia.collections WHERE name = ${name} AND id = ${id} RETURNING id
  `;
  return NextResponse.json({ ok: rows.length > 0 });
}
