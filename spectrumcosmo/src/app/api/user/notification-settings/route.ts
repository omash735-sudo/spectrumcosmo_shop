import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/getUserFromRequest'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orderUpdates, promotions } = await req.json()
  const db = getDb()

  // Add column if not exists: ALTER TABLE users ADD COLUMN notification_preferences JSONB DEFAULT '{}'
  await db`
    UPDATE users 
    SET notification_preferences = ${JSON.stringify({ orderUpdates, promotions })}::jsonb
    WHERE email = ${user.email}
  `

  return NextResponse.json({ success: true })
}
