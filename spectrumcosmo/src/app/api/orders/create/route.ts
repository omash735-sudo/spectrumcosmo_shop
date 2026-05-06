import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/userAuth';

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();

    const {
      customer_name,
      phone_number,
      location,
      notes,
      payment_method,
      items,
      total_amount,       // already in MWK from frontend
    } = body;

    if (!customer_name || !phone_number || !location || !items?.length || !total_amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sql = getDb();

    // 1. Insert order (order‑level data)
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
      RETURNING id
    `;

    if (!order) throw new Error('Failed to create order');

    // 2. Insert each cart item into order_items (using USD amounts from cart)
    for (const item of items) {
      const unitPriceUsd = item.price_usd;
      const subtotalUsd = item.quantity * unitPriceUsd;

      await sql`
        INSERT INTO order_items (
          order_id,
          product_name,
          quantity,
          unit_price_usd,
          subtotal_usd,
          custom_details
        ) VALUES (
          ${order.id},
          ${item.name},
          ${item.quantity},
          ${unitPriceUsd},
          ${subtotalUsd},
          ${item.custom_details || null}
        )
      `;
    }

    return NextResponse.json({
      success: true,
      id: order.id,
      total_amount,
    });
  } catch (err: any) {
    console.error('Order creation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
