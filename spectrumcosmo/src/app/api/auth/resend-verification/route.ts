// app/api/auth/resend-verification/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sendMail } from '@/lib/mailer'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const sql = getDb()

    // Find active, non‑deleted, non‑verified user
    const [user] = await sql`
      SELECT id, email, name, email_verified
      FROM users
      WHERE email = ${email}
        AND deleted_at IS NULL
        AND account_status NOT IN ('banned', 'frozen')
    `

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.email_verified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
    }

    // Remove old tokens
    await sql`DELETE FROM email_verifications WHERE user_id = ${user.id}`

    // Create new token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    await sql`
      INSERT INTO email_verifications (user_id, token, expires_at)
      VALUES (${user.id}, ${token}, ${expiresAt})
    `

    // Build the same styled email as registration
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spectrumcosmo.com'
    const verificationUrl = `${appUrl}/api/auth/verify-email?token=${token}`

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 20px; overflow: hidden;">
        <div style="background: #F97316; padding: 24px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
        </div>
        <div style="padding: 24px; background: white;">
          <p style="font-size: 16px; color: #333;">Hi <strong>${user.name || user.email}</strong>,</p>
          <p style="font-size: 15px; line-height: 1.5; color: #555;">
            Please verify your email address by clicking the button below.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationUrl}" style="background: #F97316; color: white; padding: 12px 28px; text-decoration: none; border-radius: 40px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="font-size: 13px; color: #777;">This link expires in 24 hours.</p>
          <hr style="margin: 30px 0 20px; border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #999;">Questions? Just reply to this email – we're here to help.<br/>SpectrumCosmo Team – Wear your excitement with pride.</p>
        </div>
      </div>
    `

    await sendMail({
      to: user.email,
      subject: 'Verify your email address – SpectrumCosmo',
      text: `Hi ${user.name || user.email}, please verify your email: ${verificationUrl}`,
      html,
    })

    return NextResponse.json({ success: true, message: 'Verification email sent' })
  } catch (err: any) {
    console.error('Resend verification error:', err)
    return NextResponse.json({ error: 'Unable to resend verification email' }, { status: 500 })
  }
}
