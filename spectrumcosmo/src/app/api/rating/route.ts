// app/api/rating/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getVerifiedUser } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req)
  if (error) return error

  const { stars, comment } = await req.json()
  if (!stars || stars < 1 || stars > 5) {
    return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
  }

  const db = getDb()
  await db`
    INSERT INTO ratings (id, user_id, stars, comment)
    VALUES (gen_random_uuid(), ${user.id}, ${stars}, ${comment || null})
  `

  return NextResponse.json({ success: true })
}

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req)
  if (error) return error

  // Optional: only allow admin
  // if (!user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = getDb()
  const ratings = await db`
    SELECT r.*, u.name, u.email
    FROM ratings r
    JOIN users u ON r.user_id = u.id
    ORDER BY r.created_at DESC
  `
  return NextResponse.json(ratings)
}
