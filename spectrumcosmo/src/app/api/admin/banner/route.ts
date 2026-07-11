// app/api/admin/banner/route.ts
import { NextResponse } from 'next/server';
import { getDb, queryOne, queryMany, query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Fetch banner for admin
export async function GET() {
  try {
    const sql = getDb();
    const banner = await queryOne<{
      id: number;
      is_active: boolean;
      items: any[];
      background_color: string;
      text_color: string;
      updated_at: Date;
    }>`
      SELECT * FROM top_banner ORDER BY id DESC LIMIT 1
    `;

    if (!banner) {
      return NextResponse.json({
        id: null,
        is_active: true,
        items: [
          { icon: 'Truck', text: 'Free shipping over 50,000 MWK' },
          { icon: 'Shield', text: '30-day returns' },
          { icon: 'Tag', text: 'Subscribe for 10% off' }
        ],
        background_color: '#C96712',
        text_color: '#FFFFFF'
      });
    }

    return NextResponse.json(banner);
  } catch (error) {
    console.error('Error fetching banner:', error);
    return NextResponse.json(
      { error: 'Failed to fetch banner' },
      { status: 500 }
    );
  }
}

// POST - Create or update banner
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

    // Check if banner exists
    const existing = await queryOne<{ id: number }>`
      SELECT id FROM top_banner ORDER BY id DESC LIMIT 1
    `;

    if (existing) {
      // Update existing banner
      await query`
        UPDATE top_banner 
        SET 
          items = ${JSON.stringify(items)}::jsonb,
          is_active = ${is_active},
          background_color = ${background_color || '#C96712'},
          text_color = ${text_color || '#FFFFFF'},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existing.id}
      `;
    } else {
      // Insert new banner
      await query`
        INSERT INTO top_banner (items, is_active, background_color, text_color)
        VALUES (
          ${JSON.stringify(items)}::jsonb,
          ${is_active},
          ${background_color || '#C96712'},
          ${text_color || '#FFFFFF'}
        )
      `;
    }

    return NextResponse.json({
      success: true,
      message: 'Banner saved successfully'
    });
  } catch (error) {
    console.error('Error saving banner:', error);
    return NextResponse.json(
      { error: 'Failed to save banner' },
      { status: 500 }
    );
  }
}
