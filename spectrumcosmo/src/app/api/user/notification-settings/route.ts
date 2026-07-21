// app/api/notification-settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getVerifiedUser } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req)
  if (error) return error

  const { orderUpdates, promotions } = await req.json()
  const db = getDb()

  await db`
    UPDATE users 
    SET notification_preferences = ${JSON.stringify({ orderUpdates, promotions })}::jsonb
    WHERE id = ${user.id}
  `

  return NextResponse.json({ success: true })
}
