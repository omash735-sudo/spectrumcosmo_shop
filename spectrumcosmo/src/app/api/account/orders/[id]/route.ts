import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';
import { getStatusDisplayInfo, getOrderStatusHistory } from '@/lib/order-status';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  const orderId = params.id;
  const sql = getDb();

  const [order] = await sql`
    SELECT o.*, 
           string_agg(DISTINCT CONCAT(oi.product_name, ' x', oi.quantity), ', ') as items_list
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id::uuid
    WHERE o.id = ${orderId} AND o.user_id = ${user.id}
    GROUP BY o.id
  `;

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const statusInfo = await getStatusDisplayInfo(order.status);
  const history = await getOrderStatusHistory(orderId);

  return NextResponse.json({
    order,
    statusInfo,
    history,
  });
}
