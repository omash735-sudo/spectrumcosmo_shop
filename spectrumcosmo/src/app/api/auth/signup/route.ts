import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'
import { signUserToken } from '@/lib/userAuth'
import { sendMail } from '@/lib/mailer'

async function ensureUsersTable() {
  const sql = getDb()
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      newsletter_subscribed BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'name, email, password required' }, { status: 400 })
    }

    await ensureUsersTable()
    const sql = getDb()
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const hash = await bcrypt.hash(password, 10)
    const [user] =
      await sql`INSERT INTO users (name, email, password_hash) VALUES (${name}, ${email}, ${hash}) RETURNING id, name, email`

    const token = signUserToken({ id: user.id, name: user.name, email: user.email, role: 'customer' })
    const res = NextResponse.json({ user })
    res.cookies.set('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    await sendMail({
      to: user.email,
      subject: 'Welcome to SpectrumCosmo',
      text: `Hi ${user.name}, welcome to SpectrumCosmo.`,
    }).catch(() => null)

    return res
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

