// app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { deductStock, releaseReservedStock, getStatusDisplayInfo, sendDynamicStatusEmail } from '@/lib/order-utils';

interface OrderUpdateBody {
  id: string;
  status: string;
  trackingNumber?: string;
  trackingNotes?: string;
  adminNotes?: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  unit_price_usd: number;
  product_name?: string;
}

interface UpdatedOrder {
  id: string;
  customer_email: string;
  customer_name: string;
  order_number: string | null;
  total_amount: number;
  tracking_number: string | null;
  payment_status: string;
  created_at: string;
  phone_number: string;
  location: string;
  payment_method: string;
  invoice_number?: string;
  custom_delivery_method?: string | null;
}

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const sql = getDb();

    const orders = await sql`
      SELECT 
        id, 
        order_number, 
        customer_name, 
        customer_email, 
        phone_number,
        delivery_address as location, 
        total_amount, 
        status, 
        payment_method, 
        payment_status,
        proof_of_payment_url, 
        payment_note, 
        custom_delivery_method,
        discount_amount, 
        promo_code, 
        referral_code, 
        tracking_number, 
        tracking_notes,
        admin_notes, 
        created_at, 
        updated_at, 
        delivered_at, 
        paid_at,
        expires_at,
        invoice_number
      FROM orders 
      ORDER BY created_at DESC
    `;

    if (orders.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    const orderIds = orders.map((o: any) => o.id);
    const items = await sql`
      SELECT order_id, product_name, quantity, unit_price_usd, subtotal_usd
      FROM order_items
      WHERE order_id = ANY(${orderIds})
      ORDER BY created_at
    `;

    const itemsByOrder = new Map<string, any[]>();
    for (const item of items) {
      if (!itemsByOrder.has(item.order_id)) {
        itemsByOrder.set(item.order_id, []);
      }
      itemsByOrder.get(item.order_id)!.push({
        product_name: item.product_name,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price_usd),
        total_price: Number(item.subtotal_usd) || Number(item.unit_price_usd) * Number(item.quantity),
      });
    }

    const ordersWithItems = orders.map((order: any) => ({
      ...order,
      items: itemsByOrder.get(order.id) || [],
      subtotal: order.total_amount || 0,
    }));

    return NextResponse.json({ orders: ordersWithItems });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const sql = getDb();
    await sql`DELETE FROM orders WHERE id = ${id}::uuid`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { id, status, trackingNumber, trackingNotes, adminNotes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status required' }, { status: 400 });
    }

    const sql = getDb();
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';

    const [currentOrder] = await sql`
      SELECT status, paid_at, stock_deducted FROM orders WHERE id = ${id}::uuid
    `;

    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (status === 'approved' && currentOrder.status !== 'approved') {
      if (!currentOrder.stock_deducted) {
        const stockDeducted = await deductStock(id);
        if (!stockDeducted) {
          return NextResponse.json(
            { error: 'Failed to deduct stock. Items may be out of stock.' },
            { status: 409 }
          );
        }
        await sql`UPDATE orders SET stock_deducted = true WHERE id = ${id}::uuid`;
      }
    }

    if (
      (status === 'declined' || status === 'cancelled') &&
      currentOrder.status !== 'declined' &&
      currentOrder.status !== 'cancelled'
    ) {
      if (currentOrder.stock_deducted) {
        await releaseReservedStock(id);
        await sql`UPDATE orders SET stock_deducted = false WHERE id = ${id}::uuid`;
      }
    }

    const [updatedOrder] = (await sql`
      UPDATE orders
      SET
        status = ${status},
        updated_at = NOW(),
        tracking_number = COALESCE(${trackingNumber || null}, tracking_number),
        tracking_notes = COALESCE(${trackingNotes || null}, tracking_notes),
        admin_notes = COALESCE(${adminNotes || null}, admin_notes),
        paid_at = CASE
          WHEN (${status} = 'approved' OR ${status} = 'delivered') AND paid_at IS NULL
          THEN NOW()
          ELSE paid_at
        END
      WHERE id = ${id}::uuid
      RETURNING *
    `) as UpdatedOrder[];

    if (currentOrder.status !== status) {
      await sql`
        INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, ip_address, notes, changed_at)
        VALUES (${id}::uuid, ${currentOrder.status}, ${status}, 'admin', ${ipAddress}, ${adminNotes || null}, NOW())
      `;

      const statusInfo = await getStatusDisplayInfo(status);
      if (statusInfo?.send_email) {
        try {
          await sendDynamicStatusEmail({
            customerEmail: updatedOrder.customer_email,
            customerName: updatedOrder.customer_name,
            orderId: updatedOrder.id,
            orderNumber: updatedOrder.order_number || updatedOrder.id.slice(-8),
            oldStatus: currentOrder.status,
            newStatus: status,
            totalAmount: updatedOrder.total_amount,
            trackingNumber: trackingNumber || updatedOrder.tracking_number || undefined,
            adminNotes: trackingNotes || adminNotes,
          });
        } catch (emailErr) {
          console.error('Failed to send status email:', emailErr);
        }
      }
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    console.error('Admin order update error:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
