import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { orderId, phoneNumber } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const sql = getDb();

    // Get order details
    const order = await queryOne<{
      id: string;
      quoted_delivery_fee: number;
      customer_name: string;
      phone_number: string;
      payment_status: string;
      delivery_quote_status: string;
    }>`
      SELECT id::text, quoted_delivery_fee, customer_name, phone_number, payment_status, delivery_quote_status
      FROM orders
      WHERE id::text = ${orderId}
    `;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.delivery_quote_status !== 'quoted') {
      return NextResponse.json({ error: 'No active quote for this order' }, { status: 400 });
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Delivery fee already paid' }, { status: 400 });
    }

    // Initiate payment for delivery fee only
    const paymentRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payments/onekhusa-charge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: order.quoted_delivery_fee,
        currency: 'MWK',
        phoneNumber: phoneNumber || order.phone_number,
        paymentMethod: 'Delivery Fee Payment',
        orderId: order.id,
        customerName: order.customer_name,
        isDeliveryFee: true,
      }),
    });

    const paymentData = await paymentRes.json();

    if (!paymentRes.ok) {
      return NextResponse.json(
        { error: paymentData.error || 'Payment failed' },
        { status: 400 }
      );
    }

    // Update order payment status
    await sql`
      UPDATE orders 
      SET payment_status = 'paid',
          delivery_quote_status = 'paid',
          status = 'confirmed',
          updated_at = NOW()
      WHERE id = ${order.id}::uuid
    `;

    return NextResponse.json({
      success: true,
      message: 'Delivery fee paid successfully',
      orderId: order.id,
    });
  } catch (err) {
    console.error('Delivery quote payment error:', err);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
