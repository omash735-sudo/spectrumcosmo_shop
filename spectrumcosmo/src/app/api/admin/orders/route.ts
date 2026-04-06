import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { sendOrderEmail } from '@/lib/email'

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
    UPDATE orders SET status = ${status} WHERE id = ${id} RETURNING *
  `
  const order = result[0]

  // Send completion email
  if (status === 'completed' && order.email) {
    try {
      await sendOrderEmail({
        customerName: order.customer_name,
        customerEmail: order.email,
        productName: order.product_name,
        paymentMethod: order.payment_method || '',
        deliveryMethod: order.delivery_method || '',
        totalAmount: order.total_amount || 0,
        currency: 'MWK',
        orderId: order.id,
        status: 'completed',
        customDetails: order.custom_details,
        createdAt: order.created_at,
      })
    } catch (emailErr) {
      console.error('Completion email failed:', emailErr)
    }
  }

  return NextResponse.json({ order })
}
