// app/api/newsletter/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400, headers: corsHeaders });
  }

  // Lower-case so "A@x.com" and "a@x.com" are one subscriber.
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: 'Please enter a valid email address.' },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    const sql = getDb();

    const existing = await sql`
      SELECT id, status FROM subscribers WHERE lower(email) = ${email} LIMIT 1
    `;

    if (existing.length > 0) {
      const row = existing[0] as { id: number; status: string };
      if (row.status === 'confirmed') {
        // Already on the list. Same friendly answer, nothing changes.
        return NextResponse.json(
          { success: true, message: 'You are already subscribed.' },
          { headers: corsHeaders }
        );
      }
      // Previously unsubscribed or never confirmed: they have just asked
      // to join again, so switch them back on.
      await sql`
        UPDATE subscribers
        SET status = 'confirmed', confirmed_at = NOW()
        WHERE id = ${row.id}
      `;
      return NextResponse.json(
        { success: true, message: 'Subscribed successfully!' },
        { headers: corsHeaders }
      );
    }

    // The send route only mails status = 'confirmed' subscribers, so a
    // person who submits the form is stored as confirmed straight away.
    await sql`
      INSERT INTO subscribers (email, name, preferences, status, confirmed_at)
      VALUES (${email}, '', ${'{}'}, 'confirmed', NOW())
    `;

    return NextResponse.json(
      { success: true, message: 'Subscribed successfully!' },
      { status: 201, headers: corsHeaders }
    );
  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    return NextResponse.json(
      { error: 'Could not subscribe right now. Please try again.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
