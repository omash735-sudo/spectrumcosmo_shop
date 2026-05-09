// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'

// GET – fetch all orders (admin only)
export async function GET(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError

  try {
    const sql = getDb()
    const orders = await sql`
      SELECT 
        o.*,
        json_agg(oi.*) as items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `
    return NextResponse.json(orders)
  } catch (err: any) {
    console.error('Orders fetch error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH – update order status (admin only)
export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError

  try {
    const { id, status } = await req.json()
    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 })
    }

    const sql = getDb()
    const [updatedOrder] = await sql`
      UPDATE orders
      SET status = ${status}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    if (!updatedOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    return NextResponse.json(updatedOrder)
  } catch (err: any) {
    console.error('Order update error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE – delete order (admin only)
export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError

  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const sql = getDb()
    await sql`DELETE FROM orders WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Order delete error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
  }
