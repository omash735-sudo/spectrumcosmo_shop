import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { stars, comment } = await req.json()
  if (!stars || stars < 1 || stars > 5) {
    return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
  }

  const db = getDb()

  // Insert rating – directly use session.email as user_email
  await db`
    INSERT INTO ratings (id, user_email, stars, comment)
    VALUES (gen_random_uuid()::text, ${session.user.email}, ${stars}, ${comment || null})
  `

  return NextResponse.json({ success: true })
}

export async function GET() {
  const db = getDb()
  const ratings = await db`
    SELECT r.*, u.name, u.email
    FROM ratings r
    JOIN users u ON r.user_email = u.email
    ORDER BY r.created_at DESC
  `
  return NextResponse.json(ratings)
}
