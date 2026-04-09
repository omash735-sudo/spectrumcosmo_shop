import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    const sql = getDb()
    const data = await sql`SELECT * FROM products ORDER BY created_at DESC`
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  try {
    const { name, description, price, image_url, category } = await req.json()
    if (!name || !price || !category) return NextResponse.json({ error: 'name, price, category required' }, { status: 400 })
    const sql = getDb()
    const [data] = await sql`INSERT INTO products (name, description, price, image_url, category) VALUES (${name}, ${description}, ${parseFloat(price)}, ${image_url}, ${category}) RETURNING *`
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  try {
    const { id, name, description, price, image_url, category } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const sql = getDb()
    const [data] = await sql`UPDATE products SET name=COALESCE(${name},name), description=COALESCE(${description},description), price=COALESCE(${price?parseFloat(price):null},price), image_url=COALESCE(${image_url},image_url), category=COALESCE(${category},category) WHERE id=${id} RETURNING *`
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const sql = getDb()
    await sql`DELETE FROM products WHERE id=${id}`
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
