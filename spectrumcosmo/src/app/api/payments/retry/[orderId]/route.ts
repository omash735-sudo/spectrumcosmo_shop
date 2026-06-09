import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne, queryAsArray } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await req.json();
    const { phoneNumber } = body;

    const sql = getDb();

    // Get order details
    const order = await queryOne<{
      id: string;
      total_amount: number;
      customer_name: string;
      phone_number: string;
      payment_status: string;
      payment_provider_id: string;
    }>`
      SELECT id::text, total_amount, customer_name, phone_number, payment_status, payment_provider_id
      FROM orders
      WHERE id::text = ${orderId}
    `;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Order already paid' }, { status: 400 });
    }

    // Get payment provider
    const provider = await queryOne<{ name: string; type: string }>`
      SELECT name, type FROM payment_providers WHERE id = ${order.payment_provider_id}
    `;

    if (!provider || provider.type !== 'automatic') {
      return NextResponse.json({ error: 'Not an automatic payment method' }, { status: 400 });
    }

    // Initiate payment again
    const paymentRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payments/onekhusa-charge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: order.total_amount,
        currency: 'MWK',
        phoneNumber: phoneNumber || order.phone_number,
        paymentMethod: provider.name,
        orderId: order.id,
        customerName: order.customer_name,
        isRetry: true,
      }),
    });

    const paymentData = await paymentRes.json();

    if (!paymentRes.ok) {
      return NextResponse.json(
        { error: paymentData.error || 'Payment retry failed' },
        { status: 400 }
      );
    }

    // Update order payment status
    await sql`
      UPDATE orders 
      SET payment_status = 'pending', 
          updated_at = NOW() 
      WHERE id = ${order.id}::uuid
    `;

    return NextResponse.json({
      success: true,
      message: 'Payment request sent successfully',
      orderId: order.id,
    });
  } catch (err) {
    console.error('Payment retry error:', err);
    return NextResponse.json(
      { error: 'Failed to retry payment' },
      { status: 500 }
    );
  }
}
