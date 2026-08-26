import { NextResponse } from 'next/server';
import { getDb, queryMany, queryOne } from '@/lib/db';

export async function GET() {
  try {
    const sql = getDb();
    
    const featuredEvent = await queryOne`
      SELECT * FROM site_events 
      WHERE active = true 
        AND featured = true
        AND (ends_at IS NULL OR ends_at >= NOW())
      ORDER BY event_date DESC
      LIMIT 1
    `;

    let events = await queryMany`
      SELECT * FROM site_events 
      WHERE active = true 
        AND (ends_at IS NULL OR ends_at >= NOW())
        AND featured = false
      ORDER BY event_date DESC
    `;

    if (!featuredEvent) {
      events = await queryMany`
        SELECT * FROM site_events 
        WHERE active = true 
          AND (ends_at IS NULL OR ends_at >= NOW())
        ORDER BY event_date DESC
      `;
    }

    return NextResponse.json({ featuredEvent, events });
  } catch (err) {
    console.error('Events API error:', err);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
