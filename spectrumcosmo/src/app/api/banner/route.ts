import { NextResponse } from 'next/server';
import { getDb, queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
      SELECT * FROM top_banner WHERE is_active = true ORDER BY id DESC LIMIT 1
    `;

    if (!banner) {
      return NextResponse.json({
        is_active: false,
        items: [],
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
