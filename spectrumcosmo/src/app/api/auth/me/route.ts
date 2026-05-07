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
      profile_image TEXT,
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

    // Fetch user (without old newsletter_subscribed column)
    const users = await sql`
      SELECT 
        id, 
        name, 
        email, 
        phone, 
        profile_image AS "profileImage"
      FROM users 
      WHERE id = ${userToken.id}
    `
    if (users.length === 0) return NextResponse.json({ user: null }, { status: 404 })

    const user = users[0]

    // Get subscription status from unified table
    const [subStatus] = await sql`
      SELECT is_subscribed FROM newsletter_subscriptions
      WHERE user_id = ${userToken.id} OR email = ${user.email}
      ORDER BY updated_at DESC LIMIT 1
    `
    // Default to true if no record exists (user is subscribed by default)
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
