// app/api/admin/customers/[id]/resend-verification/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authError = requireAdmin(req)
    if (authError) return authError

    const sql = getDb()
    const { id } = await params

    const [user] = await sql`
      SELECT id, name, email, email_verified
      FROM users 
      WHERE id = ${id} AND deleted_at IS NULL
    `

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.email_verified) {
      return NextResponse.json({ error: 'User is already verified' }, { status: 400 })
    }

    await sql`
      CREATE TABLE IF NOT EXISTS email_verifications (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id)
    `

    await sql`DELETE FROM email_verifications WHERE user_id = ${user.id}`

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    await sql`
      INSERT INTO email_verifications (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt})
    `

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`

    await transporter.sendMail({
      from: `"SpectrumCosmo" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: 'Verify your email address - SpectrumCosmo',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #C96712; margin-bottom: 20px;">Welcome to SpectrumCosmo!</h2>
          <p style="font-size: 16px; color: #333;">Hello ${user.name || user.email},</p>
          <p style="font-size: 16px; color: #333;">Please click the link below to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: #C96712; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
          <p style="font-size: 12px; color: #999; word-break: break-all;">${verificationUrl}</p>
          <p style="font-size: 14px; color: #666;">This link expires in 24 hours.</p>
          <p style="font-size: 14px; color: #666;">If you didn't create an account, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">SpectrumCosmo - Wear your excitement with pride</p>
        </div>
      `,
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Verification email sent successfully' 
    })

  } catch (error) {
    console.error('Error in resend verification:', error)
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    )
  }
}
