// app/api/account/orders/[id]/tracking/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  const orderId = params.id;

  try {
    const sql = getDb();
    
    // Get order with all related data
    const [order] = await sql`
      SELECT 
        o.id as order_id,
        o.order_number,
        o.customer_name,
        o.customer_email,
        o.phone_number,
        o.status as order_status,
        o.total_amount,
        o.subtotal,
        o.shipping_cost,
        o.discount_amount,
        o.payment_method,
        o.payment_status,
        o.paid_at,
        o.created_at as order_placed_at,
        o.location as delivery_address,
        o.tracking_number,
        o.tracking_notes,
        o.admin_notes,
        o.promo_code,
        o.referral_code
      FROM orders o
      WHERE o.id = ${orderId} AND o.user_id = ${user.id}
    `;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get order items
    const items = await sql`
      SELECT 
        oi.id,
        oi.product_name,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        p.image_url
      FROM order_items oi
      LEFT JOIN products p ON p.name = oi.product_name
      WHERE oi.order_id = ${orderId}
    `;

    // Get delivery method
    const [deliveryMethod] = await sql`
      SELECT name, logo_url
      FROM delivery_methods
      WHERE name = ${order.payment_method}
    `;

    // Get payment provider
    const [paymentProvider] = await sql`
      SELECT type, name, account_number
      FROM payment_options
      WHERE name = ${order.payment_method}
    `;

    const trackingDetails = {
      ...order,
      items: items || [],
      product_name: items[0]?.product_name || 'Product',
      quantity: items[0]?.quantity || 1,
      unit_price: items[0]?.unit_price || 0,
      delivery_method_name: deliveryMethod?.name,
      delivery_logo: deliveryMethod?.logo_url,
      payment_type: paymentProvider?.type,
      payment_provider: paymentProvider?.name,
      payment_account: paymentProvider?.account_number,
    };

    return NextResponse.json(trackingDetails);
  } catch (err: any) {
    console.error('Tracking error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
