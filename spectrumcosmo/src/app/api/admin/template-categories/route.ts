import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authError = requireAdmin(req);
    if (authError) return authError;

    const sql = getDb();
    const categories = await sql`
      SELECT * FROM template_categories WHERE is_active = true ORDER BY display_order ASC
    `;
    return NextResponse.json(categories);
  } catch (err: any) {
    console.error('GET categories error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authError = requireAdmin(req);
    if (authError) return authError;

    const { name, slug, description, icon, display_order } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const sql = getDb();
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const [category] = await sql`
      INSERT INTO template_categories (name, slug, description, icon, display_order, is_active)
      VALUES (${name}, ${finalSlug}, ${description || null}, ${icon || null}, ${display_order || 0}, true)
      RETURNING *
    `;
    return NextResponse.json(category);
  } catch (err: any) {
    console.error('POST category error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authError = requireAdmin(req);
    if (authError) return authError;

    const { id, name, slug, description, icon, display_order, is_active } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

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
  } catch (err: any) {
    console.error('PATCH category error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authError = requireAdmin(req);
    if (authError) return authError;

    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const sql = getDb();
    await sql`DELETE FROM template_categories WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE category error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
