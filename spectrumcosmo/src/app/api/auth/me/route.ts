import { NextRequest, NextResponse } from 'next/server'
import { getVerifiedUser } from '@/lib/auth'
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
      profile_image TEXT,
      is_admin BOOLEAN DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
}

export async function GET(req: NextRequest) {
  const { user: userToken, error: authError } = await getVerifiedUser(req)
  if (authError) return authError

  try {
    await ensureUsersTable()
    const sql = getDb()

    const users = await sql`
      SELECT 
        id, 
        name, 
        email, 
        phone, 
        profile_image AS "profileImage",
        is_admin
      FROM users 
      WHERE id = ${userToken.id}
    `
    if (users.length === 0) return NextResponse.json({ user: null }, { status: 404 })

    const user = users[0]

    const [subStatus] = await sql`
      SELECT is_subscribed FROM newsletter_subscriptions
      WHERE user_id = ${userToken.id} OR email = ${user.email}
      ORDER BY updated_at DESC LIMIT 1
    `
    const newsletter_subscribed = subStatus?.is_subscribed ?? true

    return NextResponse.json({ 
      user: { 
        ...user, 
        newsletter_subscribed 
      } 
    })
  } catch (err: any) {
    console.error('Auth me error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
