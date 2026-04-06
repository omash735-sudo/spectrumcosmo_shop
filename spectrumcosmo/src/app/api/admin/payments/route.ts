import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  const { type, name, details, logo_url } = await req.json()
  const sql = getDb()
  const result = await sql`
    INSERT INTO payment_options (type, name, details, logo_url)
    VALUES (${type}, ${name}, ${details || ''}, ${logo_url || ''})
    RETURNING *
  `
  return NextResponse.json({ payment: result[0] })
}

export async function PUT(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  const { id, type, name, details, logo_url, is_active } = await req.json()
  const sql = getDb()
  const result = await sql`
    UPDATE payment_options SET
      type = COALESCE(${type}, type),
      name = COALESCE(${name}, name),
      details = COALESCE(${details}, details),
      logo_url = COALESCE(${logo_url}, logo_url),
      is_active = COALESCE(${is_active}, is_active)
    WHERE id = ${id} RETURNING *
  `
  return NextResponse.json({ payment: result[0] })
}

export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  const { id } = await req.json()
  const sql = getDb()
  await sql`DELETE FROM payment_options WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
