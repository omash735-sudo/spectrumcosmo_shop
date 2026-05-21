import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  const sql = getDb();
  const [block] = await sql`SELECT * FROM content_blocks WHERE id = ${id}`;
  if (!block) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(block);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  const { type, title, description, content, is_active, display_order } = await req.json();
  const sql = getDb();

  await sql`
    UPDATE content_blocks
    SET
      type = COALESCE(${type}, type),
      title = COALESCE(${title}, title),
      description = COALESCE(${description}, description),
      content = COALESCE(${content}, content),
      is_active = COALESCE(${is_active}, is_active),
      display_order = COALESCE(${display_order}, display_order),
      updated_at = NOW()
    WHERE id = ${id}
  `;
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  const sql = getDb();
  await sql`DELETE FROM content_blocks WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
