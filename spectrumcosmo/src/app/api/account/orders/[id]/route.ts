// app/api/account/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';
import { getStatusDisplayInfo, getOrderStatusHistory } from '@/lib/order-status';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  const { id: orderId } = await params;
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

  const statusInfo = getStatusDisplayInfo(order.status);
  const history = await getOrderStatusHistory(orderId);

  return NextResponse.json({
    order,
    statusInfo,
    history,
  });
}
