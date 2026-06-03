import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminError = requireAdmin(req);
  if (adminError) return adminError;

  try {
    const { id } = await params;
    const { name, logo_url, price, is_active, sort_order } = await req.json();
    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Name and price required' }, { status: 400 });
    }
    const sql = getDb();
    const [updated] = await sql`
      UPDATE delivery_methods
      SET
        name = ${name},
        logo_url = ${logo_url || null},
        price = ${price},
        is_active = ${is_active ?? true},
        sort_order = ${sort_order ?? 0},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminError = requireAdmin(req);
  if (adminError) return adminError;

  try {
    const { id } = await params;
    const sql = getDb();
    await sql`DELETE FROM delivery_methods WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
