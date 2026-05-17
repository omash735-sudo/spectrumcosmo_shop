import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';

// GET /api/account/orders – fetch all orders for the logged-in user
export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  try {
    const sql = getDb();
    const orders = await sql`
      SELECT 
        o.*,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'price', oi.price
          )) FROM order_items oi WHERE oi.order_id = o.id
        ), '[]'::json) as items
      FROM orders o
      WHERE o.user_id = ${user.id}
      ORDER BY o.created_at DESC
    `;
    return NextResponse.json(orders);
  } catch (err: any) {
    console.error('Failed to fetch user orders:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/account/orders?id=...&action=cancel – cancel an eligible order
export async function PATCH(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const action = url.searchParams.get('action');

  if (!id || action !== 'cancel') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const sql = getDb();

    // Get order to check status and ownership
    const [order] = await sql`
      SELECT status, order_number FROM orders 
      WHERE id = ${id} AND user_id = ${user.id}
    `;
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only pending orders can be cancelled
    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending orders can be cancelled' }, { status: 400 });
    }

    // Update order status to 'cancelled'
    await sql`
      UPDATE orders 
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
    `;

    // Send cancellation email (optional)
    await sendMail({
      to: user.email,
      subject: `Order Cancelled - ${order.order_number}`,
      text: `Your order ${order.order_number} has been cancelled.`,
    }).catch(() => null);

    return NextResponse.json({ success: true, message: 'Order cancelled successfully' });
  } catch (err: any) {
    console.error('Failed to cancel order:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
