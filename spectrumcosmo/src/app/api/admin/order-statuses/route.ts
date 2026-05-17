import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET all statuses
export async function GET() {
  const authError = requireAdmin(new NextRequest(''));
  if (authError) return authError;

  const sql = getDb();
  const statuses = await sql`
    SELECT * FROM order_statuses ORDER BY display_order ASC
  `;
  return NextResponse.json(statuses);
}

// POST - add new status
export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { name, slug, description, color, icon, display_order } = await req.json();
  const sql = getDb();

  const [status] = await sql`
    INSERT INTO order_statuses (name, slug, description, color, icon, display_order)
    VALUES (${name}, ${slug}, ${description}, ${color}, ${icon}, ${display_order})
    RETURNING *
  `;
  return NextResponse.json(status);
}

// PATCH - update status
export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { id, name, slug, description, color, icon, display_order, is_active } = await req.json();
  const sql = getDb();

  const [status] = await sql`
    UPDATE order_statuses 
    SET name = COALESCE(${name}, name),
        slug = COALESCE(${slug}, slug),
        description = COALESCE(${description}, description),
        color = COALESCE(${color}, color),
        icon = COALESCE(${icon}, icon),
        display_order = COALESCE(${display_order}, display_order),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return NextResponse.json(status);
}

// DELETE - remove status
export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const sql = getDb();
  await sql`DELETE FROM order_statuses WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
