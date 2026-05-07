import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// POST: Subscribe a new email
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    const sql = getDb()
    const normalizedEmail = email.toLowerCase()

    // Insert email – relies on unique constraint on email column
    await sql`
      INSERT INTO subscribers (email, created_at)
      VALUES (${normalizedEmail}, NOW())
      ON CONFLICT (email) DO NOTHING
    `

    // Optional: check if it was inserted or already existed
    const [result] = await sql`
      SELECT email FROM subscribers WHERE email = ${normalizedEmail}
    `
    const alreadySubscribed = result?.email !== normalizedEmail // actually if ON CONFLICT DO NOTHING, it doesn't return error, but we can check existence after.

    // Better: after insert, we can return a flag if it was new
    // But the footer already checks before POST, so this is fine.
    return NextResponse.json({ success: true, message: 'Subscribed successfully!' })
  } catch (err: any) {
    console.error('Subscribe error:', err)
    // Handle duplicate gracefully (if unique constraint violation)
    if (err.message?.includes('duplicate key') || err.code === '23505') {
      return NextResponse.json({ error: 'Email already subscribed' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: Check if an email is already subscribed
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email')

    if (!email) {
      return NextResponse.json({ subscribed: false, error: 'Email parameter missing' }, { status: 400 })
    }

    const sql = getDb()
    const normalizedEmail = email.toLowerCase()
    const result = await sql`
      SELECT email FROM subscribers WHERE email = ${normalizedEmail}
    `

    return NextResponse.json({ subscribed: result.length > 0 })
  } catch (err: any) {
    console.error('Check subscription error:', err)
    return NextResponse.json({ subscribed: false, error: 'Internal server error' }, { status: 500 })
  }
}
