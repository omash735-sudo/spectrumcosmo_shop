import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { email, reason, details } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const sql = getDb();
  await sql`
    UPDATE subscribers
    SET status = 'unsubscribed', unsubscribed_at = NOW()
    WHERE email = ${email.toLowerCase()}
  `;
  if (reason) {
    await sql`
      INSERT INTO unsubscribe_feedback (email, reason, details)
      VALUES (${email.toLowerCase()}, ${reason}, ${details || null})
    `;
  }
  return NextResponse.json({ success: true });
}

// GET for a simple one‑click unsubscribe link
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  const sql = getDb();
  await sql`
    UPDATE subscribers SET status = 'unsubscribed', unsubscribed_at = NOW()
    WHERE email = ${email.toLowerCase()}
  `;
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/newsletter?unsubscribed=true`);
}
