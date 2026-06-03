// app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  
  const sql = getDb()
  const products = await sql`
    SELECT 
      p.*, 
      c.name as category_name,
      (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id) as variant_count
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC
  `
  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  
  const { 
    name, 
    description, 
    price_mwk, 
    compare_price_mwk,
    image_url, 
    category_id, 
    status, 
    stock_quantity,
    is_featured 
  } = await req.json()
  
  if (!name || !price_mwk || !category_id) {
    return NextResponse.json({ error: 'Name, price and category required' }, { status: 400 })
  }
  
  const sql = getDb()
  const result = await sql`
    INSERT INTO products (
      name, 
      description, 
      price, 
      compare_price,
      currency, 
      image_url, 
      category_id, 
      status, 
      stock_quantity,
      is_featured
    )
    VALUES (
      ${name}, 
      ${description || ''}, 
      ${price_mwk}, 
      ${compare_price_mwk || null},
      'MWK', 
      ${image_url || ''}, 
      ${category_id}, 
      ${status || 'in_stock'}, 
      ${stock_quantity || 0},
      ${is_featured || false}
    )
    RETURNING *
  `
  return NextResponse.json(result[0])
}

export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  
  const { 
    id, 
    name, 
    description, 
    price_mwk, 
    compare_price_mwk,
    image_url, 
    category_id, 
    status, 
    stock_quantity,
    is_featured 
  } = await req.json()
  
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 })
  }
  
  const sql = getDb()
  const result = await sql`
    UPDATE products SET
      name = COALESCE(${name}, name),
      description = COALESCE(${description}, description),
      price = COALESCE(${price_mwk}, price),
      compare_price = COALESCE(${compare_price_mwk}, compare_price),
      currency = 'MWK',
      image_url = COALESCE(${image_url}, image_url),
      category_id = COALESCE(${category_id}, category_id),
      status = COALESCE(${status}, status),
      stock_quantity = COALESCE(${stock_quantity}, stock_quantity),
      is_featured = COALESCE(${is_featured}, is_featured),
      updated_at = NOW()
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
  
  // Delete variants first (foreign key constraint)
  await sql`DELETE FROM product_variants WHERE product_id = ${id}`
  await sql`DELETE FROM products WHERE id = ${id}`
  
  return NextResponse.json({ success: true })
}
