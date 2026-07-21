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

    // Ensure the table exists with the correct UUID type
    await sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        user_id UUID NOT NULL PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Find an active, non‑deleted user
    const [user] = await sql`
      SELECT id, email, name FROM users
      WHERE email = ${email}
        AND deleted_at IS NULL
        AND account_status != 'banned'
    `;

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate a reset token (valid 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Remove any existing token for this user
    await sql`DELETE FROM password_reset_tokens WHERE user_id = ${user.id}`;

    // Insert the new token
    await sql`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (${user.id}, ${resetToken}, ${expiresAt})
    `;

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 20px; overflow: hidden;">
        <div style="background: #F97316; padding: 24px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
        </div>
        <div style="padding: 24px; background: white;">
          <p style="font-size: 16px; color: #333;">Hi <strong>${user.name || user.email}</strong>,</p>
          <p style="font-size: 15px; line-height: 1.5; color: #555;">
            We received a request to reset your SpectrumCosmo password. Click the button below to choose a new one.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="background: #F97316; color: white; padding: 12px 28px; text-decoration: none; border-radius: 40px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="font-size: 13px; color: #777;">This link expires in 1 hour. If you didn't request a password reset, please ignore this email – your account is safe.</p>
          <hr style="margin: 30px 0 20px; border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #999;">Questions? Just reply to this email – we're here to help.<br/>SpectrumCosmo Team – Wear your excitement with pride.</p>
        </div>
      </div>
    `;

    // Fire‑and‑forget: send the email but never crash the request
    sendMail({
      to: email,
      subject: 'Password Reset Request – SpectrumCosmo',
      text: `Hi ${user.name || email},\n\nReset your password here: ${resetUrl}\n\nThis link expires in 1 hour.`,
      html,
    }).catch(err => console.error('Failed to send password reset email:', err));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json(
      { error: 'Unable to process your request. Please try again later.' },
      { status: 500 }
    );
  }
}
