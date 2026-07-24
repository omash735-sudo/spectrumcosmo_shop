import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getDb();
    const banner = await sql`
      SELECT * FROM top_banner ORDER BY id DESC LIMIT 1
    `;

    if (!banner || banner.length === 0) {
      return NextResponse.json({
        id: null,
        is_active: false,
        items: [],
        background_color: '#C96712',
        text_color: '#FFFFFF'
      });
    }

    return NextResponse.json(banner[0]);
  } catch (error) {
    console.error('Error fetching banner:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banner' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, is_active, background_color, text_color } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items are required' },
        { status: 400 }
      );
    }

    const sql = getDb();

    const existing = await sql`
      SELECT id FROM top_banner ORDER BY id DESC LIMIT 1
    `;

    if (existing && existing.length > 0) {
      await sql`
        UPDATE top_banner 
        SET 
          items = ${JSON.stringify(items)}::jsonb,
          is_active = ${is_active},
          background_color = ${background_color || '#C96712'},
          text_color = ${text_color || '#FFFFFF'},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existing[0].id}
      `;
    } else {
      await sql`
        INSERT INTO top_banner (items, is_active, background_color, text_color)
        VALUES (
          ${JSON.stringify(items)}::jsonb,
          ${is_active},
          ${background_color || '#C96712'},
          ${text_color || '#FFFFFF'}
        )
      `;
    }

    const updated = await sql`
      SELECT * FROM top_banner ORDER BY id DESC LIMIT 1
    `;

    return NextResponse.json({
      success: true,
      message: 'Banner saved successfully',
      banner: updated[0] || null
    });
  } catch (error) {
    console.error('Error saving banner:', error);
    return NextResponse.json(
      { error: 'Failed to save banner' },
      { status: 500 }
    );
  }
}
