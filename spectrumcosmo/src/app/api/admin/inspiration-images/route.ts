import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET all inspiration images (admin)
export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const sql = getDb();
    const images = await sql`
      SELECT * FROM inspiration_images
      ORDER BY display_order ASC, created_at DESC
    `;
    return NextResponse.json(images);
  } catch (err) {
    console.error('Failed to fetch inspiration images:', err);
    return NextResponse.json([]);
  }
}

// POST create new inspiration image
export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { image_url, title, description, display_order, is_active } = await req.json();

    if (!image_url) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    const sql = getDb();

    const [maxOrder] = await sql`SELECT MAX(display_order) as max FROM inspiration_images`;
    const newOrder = display_order ?? (maxOrder?.max || 0) + 1;

    const [newImage] = await sql`
      INSERT INTO inspiration_images (image_url, title, description, display_order, is_active, created_at, updated_at)
      VALUES (${image_url}, ${title || null}, ${description || null}, ${newOrder}, ${is_active ?? true}, NOW(), NOW())
      RETURNING *
    `;

    return NextResponse.json(newImage, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH update inspiration image
export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id, image_url, title, description, display_order, is_active } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Image id required' }, { status: 400 });
    }

    const sql = getDb();

    await sql`
      UPDATE inspiration_images
      SET
        image_url = COALESCE(${image_url}, image_url),
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        display_order = COALESCE(${display_order}, display_order),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE inspiration image
export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Image id required' }, { status: 400 });
    }

    const sql = getDb();
    await sql`DELETE FROM inspiration_images WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT reorder images
export async function PUT(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { orderedIds } = await req.json();
    const sql = getDb();

    for (let i = 0; i < orderedIds.length; i++) {
      await sql`
        UPDATE inspiration_images SET display_order = ${i} WHERE id = ${orderedIds[i]}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
