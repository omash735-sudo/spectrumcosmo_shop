import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserFromCookies } from '@/lib/auth'
import { sendOrderEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const user = await getUserFromCookies()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sql = getDb()
  const orders = await sql`
    SELECT * FROM orders WHERE user_id = ${user.id} ORDER BY created_at DESC
  `
  return NextResponse.json({ orders })
}

export async function POST(req: NextRequest) {
  try {
    const {
      customer_name, phone_number, email, product_name, product_id,
      custom_details, payment_method, delivery_method, total_amount, currency,
    } = await req.json()

    if (!customer_name || !phone_number || !product_name)
      return NextResponse.json({ error: 'Name, phone and product are required' }, { status: 400 })

    const sql = getDb()
    const user = await getUserFromCookies()

    const result = await sql`
      INSERT INTO orders (
        customer_name, phone_number, email, product_name, custom_details,
        payment_method, delivery_method, total_amount, user_id, status
      ) VALUES (
        ${customer_name}, ${phone_number}, ${email || ''},
        ${product_name}, ${custom_details || ''},
        ${payment_method || ''}, ${delivery_method || ''},
        ${total_amount || 0}, ${user?.id || null}, 'pending'
      ) RETURNING *
    `

    const order = result[0]

    // Send confirmation email immediately
    if (email) {
      try {
        await sendOrderEmail({
          customerName: customer_name,
          customerEmail: email,
          productName: product_name,
          paymentMethod: payment_method || '',
          deliveryMethod: delivery_method || '',
          totalAmount: total_amount || 0,
          currency: currency || 'MWK',
          orderId: order.id,
          status: 'pending',
          customDetails: custom_details,
          createdAt: order.created_at,
        })
      } catch (emailErr) {
        console.error('Email failed:', emailErr)
        // Don't fail the order if email fails
      }
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Order error:', error)
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 })
  }
}
