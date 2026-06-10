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
        sort_order
      FROM delivery_methods
      ORDER BY sort_order ASC, price ASC
    `;

    const formatted = methods.map((method) => ({
      id: Number(method.id),
      name: method.name,
      logo_url: method.logo_url,
      price: Number(method.price),
      type: method.type || 'standard',
      estimated_days: method.estimated_days,
      is_active: method.is_active === null ? true : method.is_active,
      sort_order: method.sort_order || 0,
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
      INSERT INTO delivery_methods (name, logo_url, price, type, estimated_days, is_active, sort_order)
      VALUES (${name}, ${logo_url || null}, ${price}, ${type || 'standard'}, ${estimated_days || null}, ${is_active ?? true}, ${sort_order ?? 0})
      RETURNING id, name, logo_url, price, type, estimated_days, is_active, sort_order
    `;

    return NextResponse.json({
      id: Number(newMethod.id),
      name: newMethod.name,
      logo_url: newMethod.logo_url,
      price: Number(newMethod.price),
      type: newMethod.type || 'standard',
      estimated_days: newMethod.estimated_days,
      is_active: newMethod.is_active,
      sort_order: newMethod.sort_order || 0,
    }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/admin/delivery-methods error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
