import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  try {
    const sql = getDb();
    const [order] = await sql`
      SELECT 
        o.*,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'price', oi.price,
            'subtotal', oi.quantity * oi.price
          )) FROM order_items oi WHERE oi.order_id = o.id
        ), '[]'::json) as items
      FROM orders o
      WHERE o.id = ${params.id} AND o.user_id = ${user.id}
    `;
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json(order);
  } catch (err: any) {
    console.error('Failed to fetch order:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
