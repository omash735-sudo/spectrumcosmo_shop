import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    const sql = getDb();

    // Query using text comparison (most reliable)
    const [order] = await sql`
      SELECT 
        id, customer_name, phone_number, delivery_address,
        payment_method, total_amount, status, created_at,
        proof_of_payment, payment_note
      FROM orders
      WHERE id::text = ${orderId}
    `;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch items (if table exists)
    let items = [];
    try {
      items = await sql`
        SELECT product_name, quantity, unit_price_usd, custom_details
        FROM order_items
        WHERE order_id::text = ${orderId}
      `;
    } catch {
      // ignore – items table might not exist yet
    }

    return NextResponse.json({ ...order, items });
  } catch (err: any) {
    console.error('Fetch order error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
