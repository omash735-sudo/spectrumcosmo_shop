import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';
import { reserveStock, checkStockAvailability } from '@/lib/stock-manager';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  const body = await req.json();
  const { items, deliveryMethodId, paymentMethod, totalAmount, address, phone } = body;

  if (!items?.length) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  // Check stock availability first (without reserving)
  const stockItems = items.map((item: any) => ({
    productId: item.id,
    quantity: item.quantity,
  }));

  const { available, unavailableItems } = await checkStockAvailability(stockItems);
  
  if (!available) {
    return NextResponse.json({
      error: 'Some items are out of stock',
      unavailableItems: unavailableItems.map(i => i.productId),
    }, { status: 409 });
  }

  const sql = getDb();
  const orderId = crypto.randomUUID();

  await sql`BEGIN`;

  try {
    // Reserve stock
    const reservation = await reserveStock(stockItems, orderId);
    
    if (!reservation.success) {
      await sql`ROLLBACK`;
      return NextResponse.json({
        error: 'Stock reservation failed. Some items may be sold out.',
        failedItems: reservation.failedItems,
      }, { status: 409 });
    }

    // Create order
    const [order] = await sql`
      INSERT INTO orders (
        id, user_id, customer_name, customer_email, phone_number, 
        delivery_address, total_amount, delivery_method_id, 
        payment_method, status, payment_status, created_at
      ) VALUES (
        ${orderId}, ${user.id}, ${user.name}, ${user.email}, ${phone},
        ${address}, ${totalAmount}, ${deliveryMethodId},
        ${paymentMethod}, 'pending', 'pending', NOW()
      )
      RETURNING *
    `;

    // Create order items
    for (const item of items) {
      await sql`
        INSERT INTO order_items (order_id, product_name, quantity, unit_price_usd, subtotal_usd)
        VALUES (${orderId}, ${item.name}, ${item.quantity}, ${item.priceUsd}, ${item.priceUsd * item.quantity})
      `;
    }

    await sql`COMMIT`;

    // Send order confirmation email
    await sendVerificationEmail(user.email, user.name, `order-${orderId}`);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      paymentStatus: 'pending',
      message: 'Order created successfully. Awaiting payment confirmation.',
    });
  } catch (err: any) {
    await sql`ROLLBACK`;
    console.error('Checkout error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
