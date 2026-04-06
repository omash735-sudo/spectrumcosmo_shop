import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  const { name, price, logo_url } = await req.json()
  const sql = getDb()
  const result = await sql`
    INSERT INTO delivery_methods (name, price, logo_url)
    VALUES (${name}, ${price || 0}, ${logo_url || ''})
    RETURNING *
  `
  return NextResponse.json({ delivery: result[0] })
}

export async function PUT(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  const { id, name, price, logo_url } = await req.json()
  const sql = getDb()
  const result = await sql`
    UPDATE delivery_methods SET
      name = COALESCE(${name}, name),
      price = COALESCE(${price}, price),
      logo_url = COALESCE(${logo_url}, logo_url)
    WHERE id = ${id} RETURNING *
  `
  return NextResponse.json({ delivery: result[0] })
}

export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  const { id } = await req.json()
  const sql = getDb()
  await sql`DELETE FROM delivery_methods WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
