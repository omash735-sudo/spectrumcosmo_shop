import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  const sql = getDb()
  const products = await sql`SELECT * FROM products ORDER BY created_at DESC`
  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  const { name, description, price, currency, image_url, category, status } = await req.json()
  if (!name || !price || !category)
    return NextResponse.json({ error: 'Name, price and category required' }, { status: 400 })
  const sql = getDb()
  const result = await sql`
    INSERT INTO products (name, description, price, currency, image_url, category, status)
    VALUES (${name}, ${description || ''}, ${price}, ${currency || 'MWK'}, ${image_url || ''}, ${category}, ${status || 'in_stock'})
    RETURNING *
  `
  return NextResponse.json({ product: result[0] })
}

export async function PUT(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  const { id, name, description, price, currency, image_url, category, status } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
  const sql = getDb()
  const result = await sql`
    UPDATE products SET
      name = COALESCE(${name}, name),
      description = COALESCE(${description}, description),
      price = COALESCE(${price}, price),
      currency = COALESCE(${currency}, currency),
      image_url = COALESCE(${image_url}, image_url),
      category = COALESCE(${category}, category),
      status = COALESCE(${status}, status)
    WHERE id = ${id}
    RETURNING *
  `
  return NextResponse.json({ product: result[0] })
}

export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  const { id } = await req.json()
  const sql = getDb()
  await sql`DELETE FROM products WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
