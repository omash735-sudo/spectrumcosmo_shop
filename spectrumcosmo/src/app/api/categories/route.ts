import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET all categories (ordered by sort_order, then name)
export async function GET() {
  const db = getDb();
  const categories = await db`
    SELECT * FROM categories 
    ORDER BY sort_order ASC, name ASC
  `;
  return NextResponse.json(categories);
}

// POST create a new category
export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
  }
  const db = getDb();
  const result = await db`
    INSERT INTO categories (name, is_active, sort_order)
    VALUES (${name.trim()}, true, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories))
    RETURNING *
  `;
  return NextResponse.json(result[0], { status: 201 });
}

// PATCH update category (name or image_url)
export async function PATCH(req: NextRequest) {
  const { id, name, image_url } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Category id is required' }, { status: 400 });
  }
  const db = getDb();
  if (name !== undefined) {
    await db`UPDATE categories SET name = ${name.trim()} WHERE id = ${id}`;
  }
  if (image_url !== undefined) {
    await db`UPDATE categories SET image_url = ${image_url} WHERE id = ${id}`;
  }
  return NextResponse.json({ success: true });
}

// DELETE category
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Category id is required' }, { status: 400 });
  }
  const db = getDb();
  await db`DELETE FROM categories WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
