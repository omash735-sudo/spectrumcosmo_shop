import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const sql = getDb();

    // Query order – try both text and UUID casting
    let order;
    try {
      // Try as UUID first
      const result = await sql`
        SELECT 
          id, customer_name, phone_number, delivery_address,
          payment_method, total_amount, status, created_at,
          proof_of_payment, payment_note
        FROM orders
        WHERE id = ${orderId}::uuid
      `;
      order = result[0];
    } catch {
      // Fallback to text comparison
      const result = await sql`
        SELECT 
          id, customer_name, phone_number, delivery_address,
          payment_method, total_amount, status, created_at,
          proof_of_payment, payment_note
        FROM orders
        WHERE id::text = ${orderId}
      `;
      order = result[0];
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch order items (if table exists, otherwise return empty array)
    let items = [];
    try {
      items = await sql`
        SELECT product_name, quantity, unit_price_usd, custom_details
        FROM order_items
        WHERE order_id = ${order.id}
      `;
    } catch (err) {
      console.warn('Could not fetch order_items (table might not exist):', err);
      items = [];
    }

    return NextResponse.json({ ...order, items });
  } catch (err: any) {
    console.error('Fetch order error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
