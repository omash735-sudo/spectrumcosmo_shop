import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

interface Category {
  id: string;
  name: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

// GET is public (no auth required)
export async function GET() {
  try {
    const categories = await queryAsArray<Category>`
      SELECT * FROM categories 
      ORDER BY sort_order ASC, name ASC
    `;
    return NextResponse.json(categories);
  } catch (err) {
    console.error('Failed to fetch categories:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST requires admin
export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const newCategory = await queryOne<Category>`
      INSERT INTO categories (name, is_active, sort_order)
      VALUES (${name.trim()}, true, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories))
      RETURNING *
    `;

    if (!newCategory) {
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }

    return NextResponse.json(newCategory, { status: 201 });
  } catch (err) {
    console.error('Failed to create category:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH requires admin
export async function PATCH(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { id, name, image_url } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Category id is required' }, { status: 400 });
    }

    const db = getDb();

    if (image_url !== undefined) {
      await db`
        UPDATE categories 
        SET image_url = ${image_url}, updated_at = NOW()
        WHERE id = ${id}
      `;
    }

    if (name !== undefined && name.trim()) {
      await db`
        UPDATE categories 
        SET name = ${name.trim()}, updated_at = NOW()
        WHERE id = ${id}
      `;
    }

    const updated = await queryOne<Category>`
      SELECT * FROM categories WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, category: updated });
  } catch (err) {
    console.error('PATCH error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
  }
}

// DELETE requires admin
export async function DELETE(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Category id is required' }, { status: 400 });
    }

    const db = getDb();
    const result = await queryAsArray<{ id: string }>`
      DELETE FROM categories WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete category:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
