import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET all active categories (public)
export async function GET(req: NextRequest) {
  const sql = getDb();
  const categories = await sql`
    SELECT id, name, slug, is_active, sort_order 
    FROM categories 
    WHERE is_active = true 
    ORDER BY sort_order ASC
  `;
  return NextResponse.json(categories);
}

// POST new category (admin only)
export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { name } = await req.json();
  if (!name) {
    return NextResponse.json({ error: 'Category name required' }, { status: 400 });
  }

  const sql = getDb();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  
  try {
    const [category] = await sql`
      INSERT INTO categories (name, slug, is_active, sort_order)
      VALUES (${name}, ${slug}, true, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories))
      RETURNING *
    `;
    return NextResponse.json(category);
  } catch (err: any) {
    return NextResponse.json({ error: 'Category already exists' }, { status: 400 });
  }
}

// DELETE category (admin only)
export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  const sql = getDb();
  await sql`DELETE FROM categories WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
