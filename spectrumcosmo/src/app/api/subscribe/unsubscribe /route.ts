// app/api/subscribe/unsubscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, reason, details } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const sql = getDb();
    const normalizedEmail = email.toLowerCase();

    // Update subscriber
    await sql`
      UPDATE subscribers
      SET status = 'unsubscribed', unsubscribed_at = NOW()
      WHERE email = ${normalizedEmail}
    `;

    // Update user if exists
    await sql`
      UPDATE users 
      SET newsletter_subscribed = FALSE, updated_at = NOW()
      WHERE email = ${normalizedEmail}
    `;

    // Save feedback if provided
    if (reason) {
      await sql`
        INSERT INTO unsubscribe_feedback (email, reason, details, created_at)
        VALUES (${normalizedEmail}, ${reason}, ${details || null}, NOW())
      `;
    }

    return NextResponse.json({ 
      success: true, 
      message: 'You have been unsubscribed. We\'re sad to see you go! 💔' 
    });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    return NextResponse.json(
      { error: 'Failed to unsubscribe. Please try again.' },
      { status: 500 }
    );
  }
}

// GET: One-click unsubscribe from email link
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  const sql = getDb();
  await sql`
    UPDATE subscribers 
    SET status = 'unsubscribed', unsubscribed_at = NOW()
    WHERE email = ${email.toLowerCase()}
  `;

  await sql`
    UPDATE users 
    SET newsletter_subscribed = FALSE, updated_at = NOW()
    WHERE email = ${email.toLowerCase()}
  `;

  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/newsletter?unsubscribed=true`
  );
}
