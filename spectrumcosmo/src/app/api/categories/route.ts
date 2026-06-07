// app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray, queryOne } from '@/lib/db';

interface Category {
  id: string;
  name: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export async function GET() {
  try {
    const categories = await queryAsArray<Category>`
      SELECT * FROM categories 
      ORDER BY sort_order ASC, name ASC
    `;
    return NextResponse.json(categories);
  } catch (err) {
    console.error('Failed to fetch categories:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, name, image_url } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Category id is required' }, { status: 400 });
    }

    const db = getDb();
    if (name !== undefined && name.trim()) {
      await db`
        UPDATE categories 
        SET name = ${name.trim()}, updated_at = NOW()
        WHERE id = ${id}
      `;
    }
    if (image_url !== undefined) {
      await db`
        UPDATE categories 
        SET image_url = ${image_url}, updated_at = NOW()
        WHERE id = ${id}
      `;
    }

    // Optionally fetch updated category
    const updated = await queryOne<Category>`
      SELECT * FROM categories WHERE id = ${id}
    `;

    return NextResponse.json({ success: true, category: updated });
  } catch (err) {
    console.error('Failed to update category:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
