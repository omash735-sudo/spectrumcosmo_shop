import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  const { id: orderId } = await params;
  const { response } = await req.json();

  if (!response || !['received', 'not_received', 'disputed'].includes(response)) {
    return NextResponse.json({ error: 'Invalid response' }, { status: 400 });
  }

  const sql = getDb();

  // Verify order belongs to user
  const [order] = await sql`
    SELECT id, status, customer_name, order_number 
    FROM orders 
    WHERE id = ${orderId} AND user_id = ${user.id}
  `;

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.status !== 'delivered') {
    return NextResponse.json({ error: 'Order has not been marked as delivered yet' }, { status: 400 });
  }

  // Update delivery confirmation
  const [confirmation] = await sql`
    UPDATE delivery_confirmations 
    SET response = ${response}, 
        responded_at = NOW(),
        order_archived = ${response === 'received'},
        archived_at = ${response === 'received' ? new Date() : null}
    WHERE order_id = ${orderId}
    RETURNING *
  `;

  // If no record exists, create one
  if (!confirmation) {
    await sql`
      INSERT INTO delivery_confirmations (order_id, response, responded_at, order_archived, archived_at)
      VALUES (${orderId}, ${response}, NOW(), ${response === 'received'}, ${response === 'received' ? new Date() : null})
    `;
  }

  // If customer received the order, archive it and notify admin
  if (response === 'received') {
    // Notify admin (optional)
    await createNotification({
      userId: 'admin-system', // You'll need to handle admin notifications separately
      title: 'Order Confirmed',
      message: `Customer ${order.customer_name} confirmed receipt of order #${order.order_number?.slice(-8) || orderId.slice(-8)}`,
      type: 'order_update',
    });
  }

  // If not received, create a dispute notification for admin
  if (response === 'not_received') {
    await createNotification({
      userId: 'admin-system',
      title: 'Delivery Issue Reported',
      message: `Customer ${order.customer_name} reported non-receipt of order #${order.order_number?.slice(-8) || orderId.slice(-8)}`,
      type: 'order_update',
      actionUrl: `/admin/orders/${orderId}`,
      actionLabel: 'Investigate',
    });
  }

  return NextResponse.json({
    success: true,
    message: response === 'received' 
      ? 'Thank you for confirming! Your order has been completed.'
      : 'We will investigate this issue and get back to you shortly.',
    redirectTo: response === 'received' ? '/products' : null,
  });
}
