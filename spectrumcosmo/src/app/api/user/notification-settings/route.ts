import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { orderUpdates, promotions } = await req.json()
  const db = getDb()

  // Assuming you have a column or JSON field for preferences
  await db`
    UPDATE users 
    SET notification_preferences = ${JSON.stringify({ orderUpdates, promotions })}::jsonb
    WHERE email = ${session.user.email}
  `

  return NextResponse.json({ success: true })
}
