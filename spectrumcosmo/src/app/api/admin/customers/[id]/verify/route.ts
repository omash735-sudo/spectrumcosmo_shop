// app/api/admin/customers/[id]/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const sql = getDb()
  const { id } = await params

  // Check if user exists
  const [user] = await sql`
    SELECT id, email_verified
    FROM users 
    WHERE id = ${id} AND deleted_at IS NULL
  `

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (user.email_verified) {
    return NextResponse.json({ 
      error: 'User is already verified' 
    }, { status: 400 })
  }

  // Manually verify the user
  await sql`
    UPDATE users 
    SET 
      email_verified = 1,
      email_verified_at = NOW(),
      updated_at = NOW()
    WHERE id = ${id}
  `

  return NextResponse.json({ 
    success: true, 
    message: 'User verified successfully' 
  })
}
