import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const sql = getDb()
  const { id } = await params
  await sql`
    UPDATE users SET deleted_at = NULL, account_status = 'active', updated_at = NOW()
    WHERE id = ${id}
  `
  return NextResponse.json({ success: true })
}
