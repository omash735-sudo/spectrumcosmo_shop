import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  const sql = getDb()
  const products = await sql`SELECT * FROM products ORDER BY created_at DESC`
  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  
  const { name, description, price, image_url, category, status, is_featured } = await req.json()
  
  if (!name || !price || !category) {
    return NextResponse.json({ error: 'Name, price and category required' }, { status: 400 })
  }
  
  const sql = getDb()
  const result = await sql`
    INSERT INTO products (name, description, price, currency, image_url, category, status, is_featured)
    VALUES (${name}, ${description || ''}, ${price}, 'MWK', ${image_url || ''}, ${category}, ${status || 'in_stock'}, ${is_featured || false})
    RETURNING *
  `
  return NextResponse.json(result[0])
}

export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  
  const { id, name, description, price, image_url, category, status, is_featured } = await req.json()
  
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 })
  }
  
  const sql = getDb()
  const result = await sql`
    UPDATE products SET
      name = COALESCE(${name}, name),
      description = COALESCE(${description}, description),
      price = COALESCE(${price}, price),
      currency = 'MWK',
      image_url = COALESCE(${image_url}, image_url),
      category = COALESCE(${category}, category),
      status = COALESCE(${status}, status),
      is_featured = COALESCE(${is_featured}, is_featured)
    WHERE id = ${id}
    RETURNING *
  `
  return NextResponse.json(result[0])
}

export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 })
  }
  
  const sql = getDb()
  await sql`DELETE FROM products WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
