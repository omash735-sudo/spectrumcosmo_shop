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
      newsletter_subscribed BOOLEAN NOT NULL DEFAULT true,
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

    // Build dynamic update query
    let query = sql`
      UPDATE users SET
        name = COALESCE(${name}, name),
        phone = COALESCE(${phone}, phone),
        newsletter_subscribed = COALESCE(${newsletterSubscribed}, newsletter_subscribed),
        profile_image = COALESCE(${profileImage}, profile_image)
      WHERE id = ${user.id}
      RETURNING id, name, email, phone, newsletter_subscribed, profile_image AS "profileImage"
    `

    const [updated] = await query

    // Send email only on unsubscribe
    if (newsletterSubscribed === false) {
      await sendMail({
        to: updated.email,
        subject: 'Newsletter preferences updated',
        text: 'You have unsubscribed from SpectrumCosmo newsletters.',
      }).catch(() => null)
    }

    return NextResponse.json({ user: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
