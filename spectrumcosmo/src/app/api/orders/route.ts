import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { customer_name, phone_number, product_name, custom_details } = await req.json()
    if (!customer_name || !phone_number || !product_name) return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    const sql = getDb()
    const [data] = await sql`INSERT INTO orders (customer_name, phone_number, product_name, custom_details, status) VALUES (${customer_name}, ${phone_number}, ${product_name}, ${custom_details||''}, 'pending') RETURNING *`
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  try {
    const sql = getDb()
    const data = await sql`SELECT * FROM orders ORDER BY created_at DESC`
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  try {
    const { id, status } = await req.json()
    if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })
    const sql = getDb()
    const [data] = await sql`UPDATE orders SET status=${status} WHERE id=${id} RETURNING *`
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
    await sql`DELETE FROM orders WHERE id=${id}`
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
