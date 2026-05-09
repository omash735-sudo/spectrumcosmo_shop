import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const sql = getDb()
  const { id } = await params

  const [user] = await sql`
    SELECT id, name, email, phone, account_status, created_at
    FROM users WHERE id = ${id} AND deleted_at IS NULL
  `
  if (!user) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

  const orders = await sql`
    SELECT
      o.id,
      o.total_amount,
      o.status,
      o.created_at,
      json_agg(json_build_object('product_name', oi.product_name, 'quantity', oi.quantity, 'unit_price_usd', oi.unit_price_usd, 'subtotal_usd', oi.subtotal_usd)) AS items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.user_id = ${id}
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `

  const topProducts = await sql`
    SELECT oi.product_name, SUM(oi.quantity) AS total_quantity, SUM(oi.subtotal_usd) AS total_revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE o.user_id = ${id}
    GROUP BY oi.product_name
    ORDER BY total_quantity DESC
    LIMIT 5
  `

  return NextResponse.json({ user, orders, topProducts })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const { status } = await req.json()
  if (!['active', 'frozen', 'banned'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const sql = getDb()
  const { id } = await params
  await sql`
    UPDATE users SET account_status = ${status}, updated_at = NOW()
    WHERE id = ${id}
  `
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const sql = getDb()
  const { id } = await params
  await sql`UPDATE users SET deleted_at = NOW(), updated_at = NOW() WHERE id = ${id}`
  return NextResponse.json({ success: true })
}
