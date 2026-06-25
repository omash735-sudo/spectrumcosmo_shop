import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryMany } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const client = getDb();
    const events = await queryMany`
      SELECT * FROM site_events 
      ORDER BY created_at DESC
    `;
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      badge,
      title,
      detail,
      href,
      google_form_link,
      starts_at,
      ends_at,
      active,
    } = body;

    const id = randomUUID().slice(0, 50);
    const client = getDb();

    await client`
      INSERT INTO site_events (
        id, badge, title, detail, href, google_form_link, 
        starts_at, ends_at, active, created_at, updated_at
      ) VALUES (
        ${id}, ${badge}, ${title}, ${detail}, ${href}, ${google_form_link},
        ${starts_at || null}, ${ends_at || null}, ${active || true}, 
        NOW(), NOW()
      )
    `;

    return NextResponse.json({ 
      success: true, 
      event: { id, ...body } 
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
