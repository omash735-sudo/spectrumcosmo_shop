import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/getUserFromRequest'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { stars, comment } = await req.json()
  if (!stars || stars < 1 || stars > 5) {
    return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
  }

  const db = getDb()
  await db`
    INSERT INTO ratings (id, user_email, stars, comment)
    VALUES (gen_random_uuid()::text, ${user.email}, ${stars}, ${comment || null})
  `

  return NextResponse.json({ success: true })
}

export async function GET(req: NextRequest) {
  // Optional: only allow admin – check a role field if you have one
  const user = await getUserFromRequest(req)
  // if (!user?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = getDb()
  const ratings = await db`
    SELECT r.*, u.name, u.email
    FROM ratings r
    JOIN users u ON r.user_email = u.email
    ORDER BY r.created_at DESC
  `
  return NextResponse.json(ratings)
}
