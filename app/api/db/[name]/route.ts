import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { isDbCollection, PRIVATE_COLLECTIONS } from "@/lib/db-collections";

export const dynamic = "force-dynamic";

const sql = neon(process.env.DATABASE_URL!);

/** 校验集合名与私密访问凭证；返回错误响应或 null */
function guard(req: NextRequest, name: string): NextResponse | null {
  if (!isDbCollection(name)) {
    return NextResponse.json({ error: "unknown collection" }, { status: 404 });
  }
  if (PRIVATE_COLLECTIONS.has(name)) {
    const expected = process.env.PRIVATE_PASSWORD;
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

  const rows = await sql`SELECT data FROM jia.collections WHERE name = ${name}`;
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
    await sql`
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
  const rows = await sql`
    UPDATE jia.collections
    SET data = data || ${JSON.stringify(patch)}::jsonb, updated_at = now()
    WHERE name = ${name} AND id = ${id}
    RETURNING data
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
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
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const rows = await sql`
    DELETE FROM jia.collections WHERE name = ${name} AND id = ${id} RETURNING id
  `;
  return NextResponse.json({ ok: rows.length > 0 });
}
