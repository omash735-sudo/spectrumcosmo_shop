// app/api/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne, queryAsArray } from '@/lib/db';
import { sendEmail } from '@/lib/email/send';
import { renderConfirmationEmail, renderWelcomeEmail } from '@/lib/email/templates';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const sql = getDb();
    const normalizedEmail = email.toLowerCase();
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Check if user exists in users table
    const [existingUser] = await sql`
      SELECT id, name, newsletter_subscribed FROM users WHERE email = ${normalizedEmail}
    `;

    // Check if subscriber exists
    const existingSubscribers = await queryAsArray<{ id: number; status: string; name: string }>`
      SELECT id, status, name FROM subscribers WHERE email = ${normalizedEmail}
    `;
    const existingSubscriber = existingSubscribers[0] || null;

    // Case 1: Already confirmed
    if (existingSubscriber?.status === 'confirmed' || existingUser?.newsletter_subscribed === true) {
      return NextResponse.json(
        { error: 'You\'re already subscribed! 🎉' },
        { status: 400 }
      );
    }

    // Case 2: Pending - resend confirmation
    if (existingSubscriber?.status === 'pending') {
      const token = crypto.randomBytes(32).toString('hex');
      await sql`
        UPDATE subscribers 
        SET token = ${token}, updated_at = NOW()
        WHERE id = ${existingSubscriber.id}
      `;
      
      const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/subscribe/confirm?token=${token}`;
      const displayName = name || existingSubscriber.name || 'there';
      
      await sendEmail({
        to: normalizedEmail,
        subject: 'Confirm your SpectrumCosmo subscription',
        html: renderConfirmationEmail(displayName, confirmUrl),
      });

      return NextResponse.json({
        success: true,
        message: 'Confirmation email resent. Please check your inbox! 📧',
      });
    }

    // Case 3: New subscription
    const token = crypto.randomBytes(32).toString('hex');
    const displayName = name || existingUser?.name || 'there';

    await sql`
      INSERT INTO subscribers (email, name, status, token, ip_address, user_agent, created_at)
      VALUES (${normalizedEmail}, ${displayName}, 'pending', ${token}, ${ip}, ${userAgent}, NOW())
    `;

    // If user exists in users table, update their newsletter_subscribed
    if (existingUser) {
      await sql`
        UPDATE users SET newsletter_subscribed = FALSE WHERE id = ${existingUser.id}
      `;
    }

    // Send confirmation email
    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/subscribe/confirm?token=${token}`;
    
    await sendEmail({
      to: normalizedEmail,
      subject: 'Confirm your SpectrumCosmo subscription',
      html: renderConfirmationEmail(displayName, confirmUrl),
    });

    return NextResponse.json({
      success: true,
      message: 'Check your email to confirm subscription! 📧',
    });
  } catch (err) {
    console.error('Subscription error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

// GET: Check subscription status
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ subscribed: false }, { status: 400 });
    }

    const sql = getDb();
    const [result] = await sql`
      SELECT status FROM subscribers WHERE email = ${email.toLowerCase()}
    `;
    
    return NextResponse.json({
      subscribed: result?.status === 'confirmed',
      status: result?.status || 'not_subscribed',
    });
  } catch (err) {
    console.error('Status check error:', err);
    return NextResponse.json({ subscribed: false }, { status: 500 });
  }
}
