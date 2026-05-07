import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserFromRequest } from '@/lib/userAuth'

// POST: Subscribe an email (guest or logged-in)
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    const user = getUserFromRequest(req) // may be null for guests

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const sql = getDb()
    const normalizedEmail = email.toLowerCase()
    const userId = user?.id || null

    // Insert or update the unified table
    await sql`
      INSERT INTO newsletter_subscriptions (email, user_id, is_subscribed, subscribed_at)
      VALUES (${normalizedEmail}, ${userId}, true, NOW())
      ON CONFLICT (email) DO UPDATE SET
        is_subscribed = true,
        user_id = COALESCE(newsletter_subscriptions.user_id, EXCLUDED.user_id),
        updated_at = NOW()
    `

    return NextResponse.json({ success: true, message: 'Subscribed successfully!' })
  } catch (err: any) {
    console.error('Subscribe error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: Check if an email is already subscribed (and active)
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email')
    if (!email) {
      return NextResponse.json({ subscribed: false, error: 'Email parameter missing' }, { status: 400 })
    }

    const sql = getDb()
    const normalizedEmail = email.toLowerCase()
    const result = await sql`
      SELECT email FROM newsletter_subscriptions
      WHERE email = ${normalizedEmail} AND is_subscribed = true
    `

    return NextResponse.json({ subscribed: result.length > 0 })
  } catch (err: any) {
    console.error('Check subscription error:', err)
    return NextResponse.json({ subscribed: false, error: 'Internal server error' }, { status: 500 })
  }
}
