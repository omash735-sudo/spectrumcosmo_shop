import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { signAdminToken, verifyToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// POST — Login
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password)
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })

    const sql = getDb()
    const result = await sql`SELECT * FROM admins WHERE username = ${username}`

    if (result.length === 0)
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })

    const admin = result[0]
    const valid = await bcrypt.compare(password, admin.password_hash)

    if (!valid)
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })

    const token = signAdminToken({
      id: admin.id,
      username: admin.username,
      role: 'admin'
    })

    const response = NextResponse.json({ message: 'Login successful' })
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24
    })
    return response
  } catch (error) {
    console.error('Admin auth error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE — Logout
export async function DELETE() {
  const response = NextResponse.json({ message: 'Logged out' })
  response.cookies.delete('admin_token')
  return response
}
