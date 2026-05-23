import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    const sql = getDb();
    
    // Find user
    const [user] = await sql`
      SELECT id, email, name, email_verified FROM users WHERE email = ${email}
    `;
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (user.email_verified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }
    
    // Delete old tokens
    await sql`DELETE FROM email_verifications WHERE user_id = ${user.id}`;
    
    // Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    await sql`
      INSERT INTO email_verifications (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt})
    `;
    
    // Send email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;
    
    await transporter.sendMail({
      from: `"SpectrumCosmo" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>Verify Your Email</h2>
          <p>Hello ${user.name || user.email},</p>
          <p>Please click the link below to verify your email address:</p>
          <a href="${verificationUrl}" style="background: #F97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 16px 0;">Verify Email</a>
          <p>This link expires in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
          <hr />
          <p style="font-size: 12px; color: #666;">SpectrumCosmo</p>
        </div>
      `,
    });
    
    return NextResponse.json({ success: true, message: 'Verification email sent' });
  } catch (err: any) {
    console.error('Resend verification error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
