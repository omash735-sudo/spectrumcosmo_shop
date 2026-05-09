import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json()
    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password required' }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const sql = getDb()
    const [reset] = await sql`
      SELECT user_id, expires_at FROM password_reset_tokens
      WHERE token = ${token} AND expires_at > NOW()
    `
    if (!reset) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await sql`UPDATE users SET password_hash = ${hashed} WHERE id = ${reset.user_id}`
    await sql`DELETE FROM password_reset_tokens WHERE user_id = ${reset.user_id}`

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
