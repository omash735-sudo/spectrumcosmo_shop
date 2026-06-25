import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_id, full_name, email, phone, message } = body;

    if (!event_id || !full_name || !email) {
      return NextResponse.json(
        { error: 'Event ID, full name, and email are required' },
        { status: 400 }
      );
    }

    const id = randomUUID().slice(0, 50);
    const client = getDb();

    // Insert registration using the client directly (tagged template)
    await client`
      INSERT INTO event_registrations (
        id, event_id, full_name, email, phone, message, status, created_at
      ) VALUES (
        ${id}, ${event_id}, ${full_name}, ${email}, 
        ${phone || null}, ${message || null}, 'pending', NOW()
      )
    `;

    return NextResponse.json({ 
      success: true, 
      registration_id: id 
    });
  } catch (error) {
    console.error('Error registering for event:', error);
    return NextResponse.json(
      { error: 'Failed to register for event' },
      { status: 500 }
    );
  }
}
