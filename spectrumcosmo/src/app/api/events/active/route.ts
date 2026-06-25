import { NextResponse } from 'next/server';
import { getDb, queryOne } from '@/lib/db';

export async function GET() {
  try {
    const client = getDb();
    const event = await queryOne`
      SELECT * FROM site_events 
      WHERE active = true 
        AND (starts_at IS NULL OR starts_at <= NOW())
        AND (ends_at IS NULL OR ends_at >= NOW())
      ORDER BY starts_at DESC
      LIMIT 1
    `;

    return NextResponse.json({ event: event || null });
  } catch (error) {
    console.error('Error fetching active event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active event' },
      { status: 500 }
    );
  }
}
