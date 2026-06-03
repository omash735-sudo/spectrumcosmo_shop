import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminError = requireAdmin(req);
  if (adminError) return adminError;

  try {
    const { id } = await params;
    const { type, name, logo_url, account_number, is_active, sort_order, connector_id } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const sql = getDb();
    const [updated] = await sql`
      UPDATE payment_options
      SET
        type = ${type || null},
        name = ${name},
        logo_url = ${logo_url || null},
        account_number = ${account_number || null},
        is_active = ${is_active ?? true},
        sort_order = ${sort_order ?? 0},
        connector_id = ${connector_id || null},
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
    const result = await sql`DELETE FROM payment_options WHERE id = ${id} RETURNING id`;
    if (result.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
