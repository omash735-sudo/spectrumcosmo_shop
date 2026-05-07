import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    const sql = getDb();

    // 1. Log the ID
    console.log('🔍 Searching for orderId:', orderId);

    // 2. Get all orders (limit 5) to verify connection
    const allOrders = await sql`SELECT id::text, customer_name FROM orders LIMIT 5`;
    console.log('📦 Existing orders:', allOrders);

    // 3. Try to find the specific order
    const result = await sql`
      SELECT id::text, customer_name, total_amount, status
      FROM orders
      WHERE id::text = ${orderId}
    `;

    if (!result || result.length === 0) {
      return NextResponse.json({ 
        error: 'Order not found', 
        requestedId: orderId,
        existingIds: allOrders.map(o => o.id)
      }, { status: 404 });
    }

    // Return full order + items
    const order = result[0];
    let items = [];
    try {
      items = await sql`
        SELECT product_name, quantity, unit_price_usd, custom_details
        FROM order_items
        WHERE order_id::text = ${orderId}
      `;
    } catch (e) {}

    return NextResponse.json({ ...order, items });
  } catch (err: any) {
    console.error('🔥 API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
