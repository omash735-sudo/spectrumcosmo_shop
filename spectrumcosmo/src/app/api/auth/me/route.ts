import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/userAuth'
import { getDb } from '@/lib/db'

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

export async function GET(req: NextRequest) {
  const userToken = getUserFromRequest(req)
  if (!userToken) return NextResponse.json({ user: null }, { status: 401 })

  try {
    await ensureUsersTable()
    const sql = getDb()
    const users =
      await sql`SELECT id, name, email, phone, newsletter_subscribed FROM users WHERE id = ${userToken.id}`
    if (users.length === 0) return NextResponse.json({ user: null }, { status: 404 })
    return NextResponse.json({ user: users[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

