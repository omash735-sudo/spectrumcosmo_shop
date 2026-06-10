import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError = requireAdmin(req);
  if (adminError) return adminError;

  try {
    const { id } = await params;
    const { name, logo_url, price, type, estimated_days, is_active, sort_order } = await req.json();

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
    }

    const sql = getDb();
    const [updated] = await sql`
      UPDATE delivery_methods
      SET
        name = ${name},
        logo_url = ${logo_url || null},
        price = ${price},
        type = ${type || 'standard'},
        estimated_days = ${estimated_days || null},
        is_active = ${is_active ?? true},
        sort_order = ${sort_order ?? 0},
        updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING *
    `;

    if (!updated) {
      return NextResponse.json({ error: 'Delivery method not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...updated,
      price: Number(updated.price),
      id: Number(updated.id),
    });
  } catch (err: any) {
    console.error('PUT /api/admin/delivery-methods/[id] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminError = requireAdmin(req);
  if (adminError) return adminError;

  try {
    const { id } = await params;
    const sql = getDb();
    await sql`DELETE FROM delivery_methods WHERE id = ${id}::uuid`;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE /api/admin/delivery-methods/[id] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
