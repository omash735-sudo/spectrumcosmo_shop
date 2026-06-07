// app/api/orders/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const sql = getDb();

    // Fetch order – use queryAsArray to get a real array
    const orders = await queryAsArray<{
      id: string;
      customer_name: string;
      phone_number: string;
      delivery_address: string;
      payment_method: string;
      total_amount: number;
      status: string;
      created_at: Date;
      proof_of_payment_url: string | null;
      payment_note: string | null;
    }>`
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

    if (orders.length === 0) {
      // Optional: log existing IDs for debugging (using queryAsArray)
      let existingIds: string[] = [];
      try {
        const existingRows = await queryAsArray<{ id: string }>`
          SELECT id::text FROM orders LIMIT 5
        `;
        existingIds = existingRows.map(row => row.id);
      } catch {
        // ignore debug errors
      }
      console.log('Order not found. Existing IDs:', existingIds);
      return NextResponse.json({ error: 'Order not found', requestedId: orderId }, { status: 404 });
    }

    const order = orders[0];

    // Fetch items – use queryAsArray
    let items: any[] = [];
    try {
      items = await queryAsArray`
        SELECT product_name, quantity, unit_price_usd, custom_details
        FROM order_items
        WHERE order_id::text = ${orderId}
      `;
    } catch (err) {
      console.warn('Could not fetch order_items', err);
    }

    return NextResponse.json({ ...order, items });
  } catch (err) {
    console.error('Fetch order error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
