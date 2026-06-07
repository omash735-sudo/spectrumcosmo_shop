// app/api/account/orders/[id]/tracking/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

interface OrderTracking {
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  phone_number: string;
  order_status: string;
  total_amount: number;
  subtotal: number | null;
  shipping_cost: number | null;
  discount_amount: number | null;
  payment_method: string;
  payment_status: string;
  paid_at: string | null;
  order_placed_at: string;
  delivery_address: string;
  tracking_number: string | null;
  tracking_notes: string | null;
  admin_notes: string | null;
  promo_code: string | null;
  referral_code: string | null;
  delivery_method_id: string | null;  // Added
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  image_url: string | null;
}

interface DeliveryMethod {
  name: string;
  logo_url: string | null;
}

interface PaymentProvider {
  type: string;
  name: string;
  account_number: string | null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  const { id: orderId } = await params;

  try {
    const sql = getDb();

    // Get order with delivery_method_id
    const ordersResult = await sql`
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
        o.referral_code,
        o.delivery_method_id
      FROM orders o
      WHERE o.id = ${orderId} AND o.user_id = ${user.id}
    `;

    const ordersArray = ordersResult as any[];
    const order = ordersArray[0] as OrderTracking | undefined;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get order items
    const itemsResult = await sql`
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
    const itemsArray = itemsResult as any[];
    const items: OrderItem[] = itemsArray;

    // Get delivery method
    let deliveryMethod: DeliveryMethod | null = null;
    if (order.delivery_method_id) {
      const dmResult = await sql`
        SELECT name, logo_url
        FROM delivery_methods
        WHERE id = ${order.delivery_method_id}
      `;
      const dmArray = dmResult as any[];
      deliveryMethod = dmArray[0] as DeliveryMethod | null;
    }

    // Get payment provider
    let paymentProvider: PaymentProvider | null = null;
    if (order.payment_method) {
      const ppResult = await sql`
        SELECT type, name, account_number
        FROM payment_methods
        WHERE name = ${order.payment_method}
      `;
      const ppArray = ppResult as any[];
      paymentProvider = ppArray[0] as PaymentProvider | null;
    }

    const trackingDetails = {
      ...order,
      items,
      delivery_method_name: deliveryMethod?.name || null,
      delivery_logo: deliveryMethod?.logo_url || null,
      payment_type: paymentProvider?.type || null,
      payment_provider: paymentProvider?.name || null,
      payment_account: paymentProvider?.account_number || null,
    };

    return NextResponse.json(trackingDetails);
  } catch (err) {
    console.error('Tracking error:', err);
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : (err instanceof Error ? err.message : 'Unknown error');
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
