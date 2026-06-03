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
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'product_name', oi.product_name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'total_price', oi.total_price
            )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) as items,
        pc.code as promo_code_applied,
        pcu.discount_amount as promo_discount,
        ur.referral_code as referral_code_used,
        rt.status as referral_status
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN promo_code_usage pcu ON pcu.order_id = o.id
      LEFT JOIN promo_codes pc ON pc.id = pcu.promo_code_id
      LEFT JOIN referral_tracking rt ON rt.order_id = o.id
      LEFT JOIN user_referrals ur ON ur.user_id = rt.referrer_user_id
      GROUP BY o.id, pc.code, pcu.discount_amount, ur.referral_code, rt.status
      ORDER BY o.created_at DESC
    `
    return NextResponse.json(orders)
  } catch (err: any) {
    console.error('Orders fetch error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST – create new order (customer checkout)
export async function POST(req: NextRequest) {
  try {
    const {
      customer_name,
      customer_email,
      phone_number,
      location,
      notes,
      items,
      subtotal,
      delivery_fee,
      discount_amount,
      total_amount,
      delivery_method_id,
      payment_provider_id,
      payment_method,
      promo_code_id,
      promo_code,
      referral_code,
    } = await req.json()

    // Validation
    if (!customer_name || !customer_email || !phone_number || !location) {
      return NextResponse.json({ error: 'Missing required customer fields' }, { status: 400 })
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 })
    }
    if (!delivery_method_id) {
      return NextResponse.json({ error: 'Delivery method required' }, { status: 400 })
    }
    if (!payment_provider_id) {
      return NextResponse.json({ error: 'Payment provider required' }, { status: 400 })
    }

    const sql = getDb()

    // Begin transaction
    await sql`BEGIN`

    try {
      // Create the order
      const [order] = await sql`
        INSERT INTO orders (
          customer_name,
          customer_email,
          phone_number,
          location,
          notes,
          subtotal,
          delivery_fee,
          discount_amount,
          total_amount,
          delivery_method_id,
          payment_provider_id,
          payment_method,
          status,
          payment_status,
          created_at,
          updated_at
        )
        VALUES (
          ${customer_name},
          ${customer_email},
          ${phone_number},
          ${location},
          ${notes || null},
          ${subtotal || 0},
          ${delivery_fee || 0},
          ${discount_amount || 0},
          ${total_amount},
          ${delivery_method_id},
          ${payment_provider_id},
          ${payment_method},
          'pending',
          'pending',
          NOW(),
          NOW()
        )
        RETURNING id
      `

      const orderId = order.id

      // Insert order items
      for (const item of items) {
        await sql`
          INSERT INTO order_items (
            order_id,
            product_id,
            product_name,
            quantity,
            unit_price,
            total_price
          )
          VALUES (
            ${orderId},
            ${item.product_id},
            ${item.product_name || item.name},
            ${item.quantity},
            ${item.price},
            ${item.price * item.quantity}
          )
        `

        // Update product stock
        await sql`
          UPDATE products
          SET stock_quantity = stock_quantity - ${item.quantity},
              updated_at = NOW()
          WHERE id = ${item.product_id}
        `
      }

      // Record promo code usage if applied
      if (promo_code_id && discount_amount > 0) {
        await sql`
          INSERT INTO promo_code_usage (
            promo_code_id,
            order_id,
            discount_amount
          )
          VALUES (
            ${promo_code_id},
            ${orderId},
            ${discount_amount}
          )
        `
        
        // Increment promo code usage count
        await sql`
          UPDATE promo_codes
          SET uses_count = uses_count + 1
          WHERE id = ${promo_code_id}
        `
      }

      // Track referral if code was provided
      if (referral_code) {
        // Find the referrer by referral code
        const [referrer] = await sql`
          SELECT user_id FROM user_referrals
          WHERE referral_code = ${referral_code}
        `

        if (referrer) {
          await sql`
            INSERT INTO referral_tracking (
              referrer_user_id,
              referred_user_id,
              order_id,
              status,
              created_at
            )
            VALUES (
              ${referrer.user_id},
              NULL,
              ${orderId},
              'pending',
              NOW()
            )
          `
        }
      }

      await sql`COMMIT`

      return NextResponse.json({
        success: true,
        id: orderId,
        message: 'Order created successfully',
      }, { status: 201 })
    } catch (err: any) {
      await sql`ROLLBACK`
      console.error('Transaction error:', err)
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  } catch (err: any) {
    console.error('Order creation error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH – update order status (admin only)
export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError

  try {
    const { id, status, payment_status } = await req.json()
    
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    const sql = getDb()

    // Build update query dynamically
    let updateQuery = sql`UPDATE orders SET updated_at = NOW()`
    
    if (status) {
      updateQuery = sql`${updateQuery}, status = ${status}`
    }
    
    if (payment_status) {
      updateQuery = sql`${updateQuery}, payment_status = ${payment_status}`
    }

    updateQuery = sql`${updateQuery} WHERE id = ${id} RETURNING *`

    const [updatedOrder] = await updateQuery

    if (!updatedOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // If order status changed to 'completed', update referral tracking
    if (status === 'completed' || payment_status === 'paid') {
      const [referral] = await sql`
        SELECT id, referrer_user_id FROM referral_tracking
        WHERE order_id = ${id} AND status = 'pending'
      `

      if (referral) {
        await sql`
          UPDATE referral_tracking
          SET status = 'completed', completed_at = NOW()
          WHERE id = ${referral.id}
        `

        // Increment referrer's total referrals
        await sql`
          UPDATE user_referrals
          SET total_referrals = total_referrals + 1
          WHERE user_id = ${referral.referrer_user_id}
        `

        // Check if user reached reward threshold
        const [referrer] = await sql`
          SELECT total_referrals, eligible_reward
          FROM user_referrals
          WHERE user_id = ${referral.referrer_user_id}
        `

        const rewardThresholds = [5, 10, 20]
        const reachedThreshold = rewardThresholds.includes(referrer.total_referrals)

        if (reachedThreshold && !referrer.eligible_reward) {
          await sql`
            UPDATE user_referrals
            SET eligible_reward = true
            WHERE user_id = ${referral.referrer_user_id}
          `
        }
      }
    }

    // If order status changed to 'cancelled', update referral tracking
    if (status === 'cancelled') {
      await sql`
        UPDATE referral_tracking
        SET status = 'cancelled'
        WHERE order_id = ${id} AND status = 'pending'
      `
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
    
    // Delete order items first (foreign key constraint)
    await sql`DELETE FROM order_items WHERE order_id = ${id}`
    
    // Delete referral tracking
    await sql`DELETE FROM referral_tracking WHERE order_id = ${id}`
    
    // Delete promo code usage
    await sql`DELETE FROM promo_code_usage WHERE order_id = ${id}`
    
    // Delete the order
    await sql`DELETE FROM orders WHERE id = ${id}`
    
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Order delete error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
