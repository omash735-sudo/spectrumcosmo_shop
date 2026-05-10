import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const adminError = requireAdmin(req);
  if (adminError) return adminError;

  const sql = getDb();
  const methods = await sql`
    SELECT * FROM delivery_methods
    ORDER BY sort_order ASC, price ASC
  `;
  return NextResponse.json(methods);
}

export async function POST(req: NextRequest) {
  const adminError = requireAdmin(req);
  if (adminError) return adminError;

  try {
    const { name, logo_url, price, is_active, sort_order } = await req.json();
    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Name and price required' }, { status: 400 });
    }
    const sql = getDb();
    const [newMethod] = await sql`
      INSERT INTO delivery_methods (name, logo_url, price, is_active, sort_order, created_at, updated_at)
      VALUES (${name}, ${logo_url || null}, ${price}, ${is_active ?? true}, ${sort_order ?? 0}, NOW(), NOW())
      RETURNING *
    `;
    return NextResponse.json(newMethod, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
