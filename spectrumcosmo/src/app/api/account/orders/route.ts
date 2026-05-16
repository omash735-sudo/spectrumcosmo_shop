import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';

async function ensureOrdersSchema() {
  const sql = getDb();
  
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_number TEXT UNIQUE,
      user_id UUID,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      phone_number TEXT NOT NULL,
      delivery_address TEXT,
      total_amount DECIMAL(12,2) DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_method TEXT,
      payment_status TEXT DEFAULT 'pending',
      proof_of_payment_url TEXT,
      payment_note TEXT,
      notes TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  
  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      price DECIMAL(12,2) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
  
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(12,2) DEFAULT 0`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`;
  
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_order_number_unique'
      ) THEN
        ALTER TABLE orders ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);
      END IF;
    END $$;
  `;
}

function generateOrderNumber(): string {
  const prefix = 'SPC';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  try {
    await ensureOrdersSchema();
    const sql = getDb();
    
    const orders = await sql`
      SELECT 
        o.*,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'price', oi.price
          )) FROM order_items oi WHERE oi.order_id = o.id
        ), '[]'::json) as items
      FROM orders o
      WHERE o.user_id = ${user.id}
      ORDER BY o.created_at DESC
    `;
    
    return NextResponse.json(orders);
  } catch (err: any) {
    console.error('Failed to fetch orders:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  
  // Allow guest checkout
  let userId = user?.id || null;
  let customerEmail = user?.email || null;

  try {
    await ensureOrdersSchema();
    const sql = getDb();
    const body = await req.json();
    
    const {
      customer_name,
      phone_number,
      customer_email,
      total_amount,
      payment_method,
      location,
      notes,
      items,
    } = body;
    
    if (!customer_name || !phone_number || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const orderNumber = generateOrderNumber();
    
    const [order] = await sql`
      INSERT INTO orders (
        order_number, 
        user_id, 
        customer_name, 
        customer_email, 
        phone_number,
        delivery_address,
        total_amount, 
        payment_method, 
        payment_status, 
        notes, 
        status, 
        created_at, 
        updated_at
      ) VALUES (
        ${orderNumber}, 
        ${userId}, 
        ${customer_name}, 
        ${customer_email || customerEmail},
        ${phone_number},
        ${location || null},
        ${total_amount || 0}, 
        ${payment_method || null},
        'pending', 
        ${notes || null}, 
        'pending', 
        NOW(), 
        NOW()
      )
      RETURNING *
    `;
    
    for (const item of items) {
      await sql`
        INSERT INTO order_items (
          order_id, 
          product_id, 
          product_name, 
          quantity, 
          price, 
          created_at
        ) VALUES (
          ${order.id}, 
          ${item.product_id || null}, 
          ${item.product_name},
          ${item.quantity}, 
          ${item.price}, 
          NOW()
        )
      `;
    }
    
    const emailTo = customer_email || customerEmail;
    if (emailTo) {
      await sendMail({
        to: emailTo,
        subject: `Order Confirmation - ${orderNumber}`,
        text: `Thank you for your order! Your order number is ${orderNumber}. We will notify you once your order is processed.`,
      }).catch(() => null);
    }
    
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await sendMail({
        to: adminEmail,
        subject: `New Order Received - ${orderNumber}`,
        text: `A new order has been placed by ${customer_name}. Order number: ${orderNumber}. Total: MWK ${total_amount}`,
      }).catch(() => null);
    }
    
    return NextResponse.json(order, { status: 201 });
  } catch (err: any) {
    console.error('Failed to create order:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  try {
    await ensureOrdersSchema();
    const { id, proofOfPaymentUrl, paymentNote } = await req.json();
    
    if (!id || !proofOfPaymentUrl) {
      return NextResponse.json(
        { error: 'id and proofOfPaymentUrl required' },
        { status: 400 }
      );
    }

    const sql = getDb();
    
    const [order] = await sql`
      UPDATE orders
      SET 
        proof_of_payment_url = ${proofOfPaymentUrl},
        payment_note = ${paymentNote || ''},
        payment_status = 'awaiting_verification',
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING *
    `;
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    await sendMail({
      to: user.email,
      subject: `Payment Proof Received - ${order.order_number}`,
      text: `We have received your payment proof for order ${order.order_number}. Our team will verify it shortly.`,
    }).catch(() => null);

    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await sendMail({
        to: adminEmail,
        subject: `Payment Proof Uploaded - ${order.order_number}`,
        text: `${user.name || user.email} uploaded payment proof for order ${order.order_number}.\n\nProof URL: ${proofOfPaymentUrl}`,
      }).catch(() => null);
    }

    return NextResponse.json(order);
  } catch (err: any) {
    console.error('Failed to update order:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  try {
    await ensureOrdersSchema();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const sql = getDb();
    
    const [order] = await sql`
      SELECT status, order_number FROM orders 
      WHERE id = ${id} AND user_id = ${user.id}
    `;
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending orders can be cancelled' },
        { status: 400 }
      );
    }
    
    await sql`
      UPDATE orders 
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
    `;
    
    await sendMail({
      to: user.email,
      subject: `Order Cancelled - ${order.order_number}`,
      text: `Your order ${order.order_number} has been cancelled.`,
    }).catch(() => null);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to cancel order:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
