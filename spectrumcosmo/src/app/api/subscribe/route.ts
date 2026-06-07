// app/api/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne, queryAsArray } from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import crypto from 'crypto';

interface SubscriberStatus {
  status: string;
}

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const sql = getDb();
    const normalizedEmail = email.toLowerCase();

    // Check if already confirmed – use queryAsArray to get a real array
    const existingRows = await queryAsArray<SubscriberStatus>`
      SELECT status FROM subscribers WHERE email = ${normalizedEmail}
    `;
    const existingStatus = existingRows.length ? existingRows[0].status : null;

    if (existingStatus === 'confirmed') {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 400 });
    }
    if (existingStatus === 'pending') {
      // Resend confirmation
      const token = crypto.randomBytes(32).toString('hex');
      await sql`UPDATE subscribers SET token = ${token} WHERE email = ${normalizedEmail}`;
      const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/subscribe/confirm?token=${token}`;
      await sendMail({
        to: normalizedEmail,
        subject: 'Confirm your subscription to SpectrumCosmo',
        html: `<h2>Welcome!</h2><p>Please confirm your email:</p><a href="${confirmUrl}">Confirm</a>`,
        text: `Confirm: ${confirmUrl}`,
      });
      return NextResponse.json({ message: 'Confirmation resent' });
    }

    // Create new pending subscriber
    const token = crypto.randomBytes(32).toString('hex');
    await sql`
      INSERT INTO subscribers (email, name, status, token)
      VALUES (${normalizedEmail}, ${name || null}, 'pending', ${token})
    `;
    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/subscribe/confirm?token=${token}`;
    await sendMail({
      to: normalizedEmail,
      subject: 'Confirm your subscription',
      html: `<h2>Thank you!</h2><a href="${confirmUrl}">Click here to confirm</a>`,
      text: `Confirm: ${confirmUrl}`,
    });
    return NextResponse.json({ success: true, message: 'Check your email to confirm' });
  } catch (err) {
    console.error('Subscription POST error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) return NextResponse.json({ subscribed: false }, { status: 400 });

    const sql = getDb();
    const result = await queryAsArray<{ id: string }>`
      SELECT 1 FROM subscribers WHERE email = ${email.toLowerCase()} AND status = 'confirmed'
    `;
    return NextResponse.json({ subscribed: result.length > 0 });
  } catch (err) {
    console.error('Subscription GET error:', err);
    return NextResponse.json({ subscribed: false }, { status: 500 });
  }
}
