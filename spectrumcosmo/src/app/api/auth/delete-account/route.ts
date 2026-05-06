import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/getUserFromRequest'
import { getDb } from '@/lib/db'

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = getDb()
  await db`DELETE FROM users WHERE email = ${user.email}`

  // Clear the auth cookie
  const response = NextResponse.json({ success: true })
  response.cookies.delete('token')
  return response
}
