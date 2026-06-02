import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Test 1: Check database connection
    let sql;
    try {
      sql = getDb();
      await sql`SELECT 1`;
    } catch (dbErr) {
      console.error('Database connection failed:', dbErr);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Test 2: Check if users table exists and find user
    let user;
    try {
      const users = await sql`SELECT id, email FROM users WHERE email = ${email}`;
      user = users[0];
    } catch (userErr) {
      console.error('User query failed:', userErr);
      return NextResponse.json({ error: 'User query failed' }, { status: 500 });
    }

    if (!user) {
      // No user – return success without sending email (security best practice)
      return NextResponse.json({ success: true });
    }

    // Test 3: Check if password_reset_tokens table exists, create if not
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          token TEXT NOT NULL UNIQUE,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `;
    } catch (tableErr) {
      console.error('Table creation failed:', tableErr);
      return NextResponse.json({ error: 'Table setup failed' }, { status: 500 });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Test 4: Insert token
    try {
      await sql`
        INSERT INTO password_reset_tokens (user_id, token, expires_at)
        VALUES (${user.id}, ${resetToken}, ${expiresAt})
        ON CONFLICT (user_id) DO UPDATE SET 
          token = EXCLUDED.token, 
          expires_at = EXCLUDED.expires_at
      `;
    } catch (insertErr) {
      console.error('Token insert failed:', insertErr);
      return NextResponse.json({ error: 'Token storage failed' }, { status: 500 });
    }

    // Test 5: Check environment variable for reset URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      console.error('NEXT_PUBLIC_APP_URL is missing');
      return NextResponse.json({ error: 'App URL not configured' }, { status: 500 });
    }

    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    // Test 6: Send email (catch error but do not fail the request)
    try {
      await sendMail({
        to: email,
        subject: 'Password Reset Request',
        text: `Reset your password: ${resetUrl}`,
        html: `<a href="${resetUrl}">Reset password</a>`,
      });
      console.log('Email sent to', email);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr);
      // We still return success to the user, but log the error
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Top-level error:', err);
    return NextResponse.json(
      { error: `Error: ${err.message || 'Unknown'}` },
      { status: 500 }
    );
  }
}
