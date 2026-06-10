import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const adminError = requireAdmin(req);
  if (adminError) return adminError;

  try {
    const sql = getDb();
    const methods = await queryAsArray`
      SELECT 
        id, 
        name, 
        logo_url, 
        price, 
        type, 
        estimated_days, 
        is_active, 
        sort_order,
        created_at,
        updated_at
      FROM delivery_methods
      ORDER BY sort_order ASC, price ASC
    `;

    const formatted = methods.map((m) => ({
      ...m,
      price: Number(m.price),
      id: Number(m.id),
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error('GET /api/admin/delivery-methods error:', err);
    return NextResponse.json({ error: 'Failed to fetch delivery methods' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const adminError = requireAdmin(req);
  if (adminError) return adminError;

  try {
    const { name, logo_url, price, type, estimated_days, is_active, sort_order } = await req.json();

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    const sql = getDb();
    const [newMethod] = await sql`
      INSERT INTO delivery_methods (name, logo_url, price, type, estimated_days, is_active, sort_order, created_at, updated_at)
      VALUES (${name}, ${logo_url || null}, ${price}, ${type || 'standard'}, ${estimated_days || null}, ${is_active ?? true}, ${sort_order ?? 0}, NOW(), NOW())
      RETURNING *
    `;

    return NextResponse.json({
      ...newMethod,
      price: Number(newMethod.price),
      id: Number(newMethod.id),
    }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/admin/delivery-methods error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
