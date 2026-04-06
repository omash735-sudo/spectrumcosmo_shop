import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { signUserToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password)
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

    const sql = getDb()
    const result = await sql`SELECT * FROM users WHERE email = ${email}`
    if (result.length === 0)
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

    const user = result[0]
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid)
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

    const token = signUserToken({ id: user.id, name: user.name, email: user.email, role: 'customer' })

    const response = NextResponse.json({ message: 'Login successful', user: { name: user.name, email: user.email } })
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
