import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'
import { getVerifiedUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req)
  if (error) return error

  try {
    const { currentPassword, newPassword } = await req.json()
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password required' }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const sql = getDb()
    const [dbUser] = await sql`SELECT password_hash FROM users WHERE id = ${user.id}`
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isValid = await bcrypt.compare(currentPassword, dbUser.password_hash)
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await sql`UPDATE users SET password_hash = ${hashed} WHERE id = ${user.id}`

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Password change error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
