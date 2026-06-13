import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { createNotification } from '@/lib/notifications';
import { createAdminNotification } from '@/lib/notifications-admin';

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

  const [existing] = await sql`
    SELECT * FROM delivery_confirmations WHERE order_id = ${orderId}
  `;

  if (existing) {
    await sql`
      UPDATE delivery_confirmations 
      SET response = ${response}, responded_at = NOW(),
          order_archived = ${response === 'received'},
          archived_at = ${response === 'received' ? new Date() : null}
      WHERE order_id = ${orderId}
    `;
  } else {
    await sql`
      INSERT INTO delivery_confirmations (order_id, response, responded_at, order_archived, archived_at)
      VALUES (${orderId}, ${response}, NOW(), ${response === 'received'}, ${response === 'received' ? new Date() : null})
    `;
  }

  // Customer notifications
  if (response === 'received') {
    await createNotification({
      userId: user.id,
      title: 'Delivery Confirmed',
      message: `You confirmed receipt of order #${order.order_number?.slice(-8) || orderId.slice(-8)}. Thank you!`,
      type: 'order_update',
    });
  } else if (response === 'not_received') {
    await createNotification({
      userId: user.id,
      title: 'We Are Investigating',
      message: `We have received your report about order #${order.order_number?.slice(-8) || orderId.slice(-8)}. Our team will investigate and contact you within 24 hours.`,
      type: 'order_update',
      actionUrl: `/account/orders/${orderId}`,
      actionLabel: 'Track Status',
    });
  } else if (response === 'disputed') {
    await createNotification({
      userId: user.id,
      title: 'Dispute Registered',
      message: `Your dispute for order #${order.order_number?.slice(-8) || orderId.slice(-8)} has been registered. We will review and contact you within 48 hours.`,
      type: 'order_update',
      actionUrl: `/account/orders/${orderId}`,
      actionLabel: 'View Details',
    });
  }

  // Admin notifications
  const admins = await sql`
    SELECT id FROM users WHERE is_admin = true
  `;
  const adminIds = admins.map((a: any) => a.id);

  if (adminIds.length > 0) {
    if (response === 'not_received') {
      await createAdminNotification({
        title: 'Delivery Issue Reported',
        body: `Customer ${order.customer_name} (${user.email}) reported non-receipt of order #${order.order_number?.slice(-8) || orderId.slice(-8)}.\n\nOrder ID: ${orderId}\nCustomer ID: ${user.id}\nReported at: ${new Date().toLocaleString()}`,
        audience_type: 'specific',
        specific_customer_ids: adminIds,
        sent_by: 'system',
        metadata: { orderId, customerId: user.id, type: 'delivery_issue', priority: 'high' },
      });
    } else if (response === 'disputed') {
      await createAdminNotification({
        title: 'Order Dispute Filed',
        body: `Customer ${order.customer_name} (${user.email}) filed a dispute for order #${order.order_number?.slice(-8) || orderId.slice(-8)}.\n\nOrder ID: ${orderId}\nCustomer ID: ${user.id}\nFiled at: ${new Date().toLocaleString()}`,
        audience_type: 'specific',
        specific_customer_ids: adminIds,
        sent_by: 'system',
        metadata: { orderId, customerId: user.id, type: 'dispute', priority: 'urgent' },
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: response === 'received' 
      ? 'Thank you for confirming! Your order has been completed.'
      : response === 'not_received'
      ? 'We will investigate this issue and get back to you shortly.'
      : 'Your dispute has been registered. We will review and contact you.',
    redirectTo: response === 'received' ? '/products' : null,
  });
}
