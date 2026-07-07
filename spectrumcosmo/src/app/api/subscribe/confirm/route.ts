// app/api/subscribe/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';
import { sendEmail } from '@/lib/email/send';
import { renderWelcomeEmail } from '@/lib/email/templates';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const sql = getDb();

  // Confirm the subscriber
  const results = await queryAsArray<{ email: string; name: string }>`
    UPDATE subscribers
    SET status = 'confirmed', confirmed_at = NOW()
    WHERE token = ${token} AND status = 'pending'
    RETURNING email, name
  `;

  if (results.length === 0) {
    // Check if already confirmed
    const [existing] = await sql`
      SELECT status FROM subscribers WHERE token = ${token}
    `;
    
    if (existing?.status === 'confirmed') {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/newsletter?confirmed=true`
      );
    }
    
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  const { email, name } = results[0];

  // Update user table if exists
  const [user] = await sql`
    UPDATE users 
    SET newsletter_subscribed = TRUE, updated_at = NOW()
    WHERE email = ${email}
    RETURNING id
  `;

  // Send welcome email
  try {
    await sendEmail({
      to: email,
      subject: 'Welcome to SpectrumCosmo! 🎉',
      html: renderWelcomeEmail(name || 'Anime Fan'),
    });
  } catch (err) {
    console.error('Failed to send welcome email:', err);
    // Still redirect - welcome email failure shouldn't block confirmation
  }

  // Redirect to newsletter page with success
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/newsletter?confirmed=true`
  );
}
