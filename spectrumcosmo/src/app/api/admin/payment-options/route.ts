import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const adminError = requireAdmin(req);
  if (adminError) return adminError;

  const sql = getDb();
  const options = await sql`
    SELECT * FROM payment_options
    ORDER BY sort_order ASC, created_at ASC
  `;
  return NextResponse.json(options);
}

export async function POST(req: NextRequest) {
  const adminError = requireAdmin(req);
  if (adminError) return adminError;

  try {
    const { type, name, logo_url, account_number, is_active, sort_order, connector_id } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const sql = getDb();
    const [newOption] = await sql`
      INSERT INTO payment_options (type, name, logo_url, account_number, is_active, sort_order, connector_id, created_at, updated_at)
      VALUES (${type || null}, ${name}, ${logo_url || null}, ${account_number || null}, ${is_active ?? true}, ${sort_order ?? 0}, ${connector_id || null}, NOW(), NOW())
      RETURNING *
    `;
    return NextResponse.json(newOption, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
