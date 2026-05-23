import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
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
    const { userId, email, name } = await req.json();
    
    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const sql = getDb();
    
    // Delete any existing verification tokens for this user
    await sql`DELETE FROM email_verifications WHERE user_id = ${userId}`;
    
    // Generate a new token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    await sql`
      INSERT INTO email_verifications (user_id, token, expires_at)
      VALUES (${userId}, ${token}, ${expiresAt})
    `;
    
    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;
    
    await transporter.sendMail({
      from: `"SpectrumCosmo" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>Welcome to SpectrumCosmo!</h2>
          <p>Hello ${name || email},</p>
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
    console.error('Send verification error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
