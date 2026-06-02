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

    const sql = getDb();

    // Create table if it doesn't exist (with correct UUID type)
    await sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        user_id UUID NOT NULL PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Find the user
    const [user] = await sql`SELECT id, email FROM users WHERE email = ${email}`;
    if (!user) {
      // For security, still return success
      return NextResponse.json({ success: true });
    }

    // Generate a reset token (valid 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Delete any existing token for this user (avoid conflict)
    await sql`DELETE FROM password_reset_tokens WHERE user_id = ${user.id}`;

    // Insert the new token
    await sql`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (${user.id}, ${resetToken}, ${expiresAt})
    `;

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    // Send email (catch errors but don't fail the request)
    await sendMail({
      to: email,
      subject: 'Password Reset Request',
      text: `Reset your password: ${resetUrl}`,
      html: `<a href="${resetUrl}">Reset password</a>`,
    }).catch(err => console.error('Email send error:', err));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    // Return the actual error message to help debug
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
