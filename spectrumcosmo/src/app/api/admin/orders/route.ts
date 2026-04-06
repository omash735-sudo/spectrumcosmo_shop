import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  const sql = getDb()
  const orders = await sql`SELECT * FROM orders ORDER BY created_at DESC`
  return NextResponse.json({ orders })
}

export async function PUT(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  const { id, status } = await req.json()
  if (!id || !status)
    return NextResponse.json({ error: 'ID and status required' }, { status: 400 })
  const sql = getDb()
  const result = await sql`
    UPDATE orders SET status = ${status}
    WHERE id = ${id}
    RETURNING *
  `
  return NextResponse.json({ order: result[0] })
}
