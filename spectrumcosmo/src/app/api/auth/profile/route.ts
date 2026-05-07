import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserFromRequest } from '@/lib/userAuth'
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
      profile_image TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
}

export async function PATCH(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await ensureUsersTable()
    const { name, phone, newsletterSubscribed, profileImage } = await req.json()
    const sql = getDb()

    // Update user profile (excluding newsletter_subscribed column – it's gone)
    let query = sql`
      UPDATE users SET
        name = COALESCE(${name}, name),
        phone = COALESCE(${phone}, phone),
        profile_image = COALESCE(${profileImage}, profile_image)
      WHERE id = ${user.id}
      RETURNING id, name, email, phone, profile_image AS "profileImage"
    `

    const [updated] = await query

    // Handle newsletter subscription in the unified table
    if (newsletterSubscribed !== undefined) {
      const normalizedEmail = updated.email.toLowerCase()
      // Insert or update the unified table
      await sql`
        INSERT INTO newsletter_subscriptions (email, user_id, is_subscribed, subscribed_at)
        VALUES (${normalizedEmail}, ${user.id}, ${newsletterSubscribed}, NOW())
        ON CONFLICT (email) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          is_subscribed = EXCLUDED.is_subscribed,
          updated_at = NOW()
      `

      // Send unsubscribe email (only when explicitly unsubscribing)
      if (newsletterSubscribed === false) {
        await sendMail({
          to: updated.email,
          subject: 'Newsletter preferences updated',
          text: 'You have unsubscribed from SpectrumCosmo newsletters.',
        }).catch(() => null)
      }
    }

    // Return user without newsletter_subscribed (or add it from unified table if needed)
    return NextResponse.json({ user: updated })
  } catch (err: any) {
    console.error('Profile update error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
