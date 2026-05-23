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
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;
  
  try {
    const sql = getDb();
    
    // Check if already verified
    const [currentUser] = await sql`
      SELECT email_verified FROM users WHERE id = ${user.id}
    `;
    
    if (currentUser?.email_verified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }
    
    // Delete old tokens
    await sql`
      DELETE FROM email_verifications WHERE user_id = ${user.id}
    `;
    
    // Generate new token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    await sql`
      INSERT INTO email_verifications (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt})
    `;
    
    // Send email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
    
    await transporter.sendMail({
      from: `"SpectrumCosmo" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>Welcome to SpectrumCosmo!</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" style="background: #F97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
          <p>This link expires in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
      `,
    });
    
    return NextResponse.json({ success: true, message: 'Verification email sent' });
  } catch (err: any) {
    console.error('Send verification error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
