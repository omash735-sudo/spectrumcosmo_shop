import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const sql = getDb();

    // Use text comparison (no UUID cast)
    const orders = await sql`
      SELECT 
        id::text, 
        customer_name, 
        phone_number, 
        delivery_address,
        payment_method, 
        total_amount, 
        status, 
        created_at,
        proof_of_payment_url, 
        payment_note
      FROM orders
      WHERE id::text = ${orderId}
    `;

    if (!orders || orders.length === 0) {
      // Optional: log existing IDs for debugging
      const existing = await sql`SELECT id::text FROM orders LIMIT 5`;
      console.log('Order not found. Existing IDs:', existing.map(o => o.id));
      return NextResponse.json({ error: 'Order not found', requestedId: orderId }, { status: 404 });
    }

    const order = orders[0];

    // Fetch items (if table exists)
    let items = [];
    try {
      items = await sql`
        SELECT product_name, quantity, unit_price_usd, custom_details
        FROM order_items
        WHERE order_id::text = ${orderId}
      `;
    } catch (err) {
      console.warn('Could not fetch order_items', err);
    }

    return NextResponse.json({ ...order, items });
  } catch (err: any) {
    console.error('Fetch order error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
