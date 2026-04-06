import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { signUserToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password)
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })

    if (password.length < 6)
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

    const sql = getDb()
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`
    if (existing.length > 0)
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })

    const password_hash = await bcrypt.hash(password, 10)
    const result = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${password_hash})
      RETURNING id, name, email
    `
    const user = result[0]
    const token = signUserToken({ id: user.id, name: user.name, email: user.email, role: 'customer' })

    const response = NextResponse.json({ message: 'Account created successfully' })
    response.cookies.set('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    })
    return response
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
