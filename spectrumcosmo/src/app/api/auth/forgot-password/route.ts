import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sendMail } from '@/lib/mailer'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const sql = getDb()
    const [user] = await sql`SELECT id, email FROM users WHERE email = ${email}`
    if (!user) {
      // For security, still return success (don't reveal non-existent email)
      return NextResponse.json({ success: true })
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await sql`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (${user.id}, ${resetToken}, ${expiresAt})
      ON CONFLICT (user_id) DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at
    `

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`
    await sendMail({
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link expires in 1 hour.`,
      html: `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p>`,
    }).catch(err => console.error('Email error:', err))

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
