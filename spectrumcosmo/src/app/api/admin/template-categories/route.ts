import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  const authError = requireAdmin(new NextRequest(''));
  if (authError) return authError;

  const sql = getDb();
  const categories = await sql`
    SELECT * FROM template_categories ORDER BY display_order ASC
  `;
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { name, slug, description, icon, display_order } = await req.json();
  const sql = getDb();

  const [category] = await sql`
    INSERT INTO template_categories (name, slug, description, icon, display_order)
    VALUES (${name}, ${slug}, ${description}, ${icon}, ${display_order})
    RETURNING *
  `;
  return NextResponse.json(category);
}

export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { id, name, slug, description, icon, display_order, is_active } = await req.json();
  const sql = getDb();

  const [category] = await sql`
    UPDATE template_categories 
    SET name = COALESCE(${name}, name),
        slug = COALESCE(${slug}, slug),
        description = COALESCE(${description}, description),
        icon = COALESCE(${icon}, icon),
        display_order = COALESCE(${display_order}, display_order),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return NextResponse.json(category);
}

export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const sql = getDb();
  await sql`DELETE FROM template_categories WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
