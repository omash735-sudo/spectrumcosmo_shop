import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET all slides (admin)
export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const sql = getDb();
    const slides = await sql`
      SELECT * FROM hero_slides
      ORDER BY display_order ASC
    `;
    return NextResponse.json(slides);
  } catch (err) {
    console.error('Failed to fetch hero slides:', err);
    return NextResponse.json([]);
  }
}

// POST create new slide
export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { image_url, title, description, button_text, button_link, autoplay_delay, is_active } = await req.json();

    if (!image_url) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    const sql = getDb();

    // Get current max display_order
    const [maxOrder] = await sql`SELECT MAX(display_order) as max FROM hero_slides`;
    const newOrder = (maxOrder?.max || 0) + 1;

    const [newSlide] = await sql`
      INSERT INTO hero_slides (image_url, title, description, button_text, button_link, display_order, autoplay_delay, is_active, created_at, updated_at)
      VALUES (${image_url}, ${title || null}, ${description || null}, ${button_text || null}, ${button_link || null}, ${newOrder}, ${autoplay_delay || 5000}, ${is_active ?? true}, NOW(), NOW())
      RETURNING *
    `;

    return NextResponse.json(newSlide, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH update slide
export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id, image_url, title, description, button_text, button_link, display_order, autoplay_delay, is_active } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Slide id required' }, { status: 400 });
    }

    const sql = getDb();

    await sql`
      UPDATE hero_slides
      SET
        image_url = COALESCE(${image_url}, image_url),
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        button_text = COALESCE(${button_text}, button_text),
        button_link = COALESCE(${button_link}, button_link),
        display_order = COALESCE(${display_order}, display_order),
        autoplay_delay = COALESCE(${autoplay_delay}, autoplay_delay),
        is_active = COALESCE(${is_active}, is_active),
        updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE slide
export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Slide id required' }, { status: 400 });
    }

    const sql = getDb();
    await sql`DELETE FROM hero_slides WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST reorder slides
export async function PUT(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { orderedIds } = await req.json();
    const sql = getDb();

    for (let i = 0; i < orderedIds.length; i++) {
      await sql`
        UPDATE hero_slides SET display_order = ${i} WHERE id = ${orderedIds[i]}
      `;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
