// app/api/orders/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne, queryAsArray } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const sql = getDb();

    // Get order
    const order = await queryOne<{
      id: string;
      customer_name: string;
      customer_email: string;
      phone_number: string;
      total_amount: number;
      currency: string;
      payment_status: string;
      payment_method: string;
      status: string;
      created_at: string;
      delivery_method: string | null;
      proof_of_payment_url: string | null;
      payment_note: string | null;
    }>`
      SELECT 
        id::text,
        customer_name,
        customer_email,
        phone_number,
        total_amount,
        currency,
        payment_status,
        payment_method,
        status,
        created_at,
        delivery_method,
        proof_of_payment_url,
        payment_note
      FROM orders
      WHERE id::text = ${orderId}
    `;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get order items
    const items = await queryAsArray<{
      id: number;
      product_name: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
      custom_details: string | null;
    }>`
      SELECT 
        id,
        product_name,
        quantity,
        unit_price_usd as unit_price,
        subtotal_usd as subtotal,
        custom_details
      FROM order_items
      WHERE order_id::text = ${orderId}
    `;

    return NextResponse.json({
      ...order,
      items: items.map(item => ({
        id: String(item.id),
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.subtotal,
        custom_details: item.custom_details,
      })),
    });
  } catch (err) {
    console.error('Fetch order error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
