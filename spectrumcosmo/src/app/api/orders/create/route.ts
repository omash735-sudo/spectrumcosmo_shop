import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserFromRequest } from '@/lib/userAuth'

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req) // optional – may not be logged in
    const body = await req.json()

    const {
      customer_name,
      phone_number,
      location,
      notes,
      payment_method,
      items,
      total_amount,
    } = body

    // Validation
    if (!customer_name || !phone_number || !location || !items?.length || !total_amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const sql = getDb()

    // 1. Insert the order
    const [order] = await sql`
      INSERT INTO orders (
        customer_name,
        phone_number,
        delivery_address,
        payment_note,
        payment_method,
        total_amount,
        status,
        user_id,
        created_at
      ) VALUES (
        ${customer_name},
        ${phone_number},
        ${location},
        ${notes || ''},
        ${payment_method},
        ${total_amount},
        'pending',
        ${user?.id || null},
        NOW()
      )
      RETURNING id, total_amount
    `

    if (!order) throw new Error('Failed to create order')

    // 2. Insert order items
    for (const item of items) {
      await sql`
        INSERT INTO order_items (
          order_id,
          product_name,
          quantity,
          unit_price,
          subtotal
        ) VALUES (
          ${order.id},
          ${item.name},
          ${item.quantity},
          ${item.price},
          ${item.quantity * item.price}
        )
      `
    }

    return NextResponse.json({
      success: true,
      id: order.id,
      total_amount: order.total_amount,
    })
  } catch (err: any) {
    console.error('Order creation error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
