import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { updateOrderStatus, getStatusDisplayInfo } from '@/lib/order-status';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const orderId = params.id;
  const body = await req.json();
  const { status, trackingNumber, trackingNotes, adminNotes } = body;

  if (!status) {
    return NextResponse.json({ error: 'Status is required' }, { status: 400 });
  }

  // Validate status exists
  const statusInfo = await getStatusDisplayInfo(status);
  if (!statusInfo) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  try {
    const result = await updateOrderStatus({
      orderId,
      newStatusSlug: status,
      adminNotes: adminNotes || trackingNotes,
      trackingNumber,
      trackingNotes,
      changedBy: 'admin',
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ 
      success: true, 
      order: result.order,
      statusInfo 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const sql = getDb();
  const orderId = params.id;

  const [order] = await sql`
    SELECT o.*, 
           array_agg(DISTINCT oi.product_name) as items,
           string_agg(DISTINCT CONCAT(oi.product_name, ' x', oi.quantity), ', ') as items_list
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id::uuid
    WHERE o.id = ${orderId}
    GROUP BY o.id
  `;

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const statusInfo = await getStatusDisplayInfo(order.status);
  const history = await getOrderStatusHistory(orderId);
  const availableStatuses = await getAllowedStatusTransitions(order.status);

  return NextResponse.json({
    order,
    statusInfo,
    history,
    availableStatuses,
  });
}
