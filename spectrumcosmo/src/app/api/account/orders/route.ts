import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  try {
    const sql = getDb();
    
    // Match your actual table columns
    const orders = await sql`
      SELECT 
        id,
        order_number,
        customer_name,
        customer_email,
        phone_number,
        delivery_address,
        total_amount,
        status,
        payment_method,
        payment_status,
        proof_of_payment_url,
        payment_note,
        delivery_method_id,
        delivery_fee,
        created_at,
        updated_at
      FROM orders
      WHERE user_id = ${user.id} OR customer_email = ${user.email}
      ORDER BY created_at DESC
    `;
    
    return NextResponse.json(orders);
  } catch (err: any) {
    console.error('Failed to fetch user orders:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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

    const [order] = await sql`
      SELECT status, order_number FROM orders 
      WHERE id = ${id} AND (user_id = ${user.id} OR customer_email = ${user.email})
    `;
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending orders can be cancelled' }, { status: 400 });
    }

    await sql`
      UPDATE orders 
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = ${id} AND (user_id = ${user.id} OR customer_email = ${user.email})
    `;

    return NextResponse.json({ success: true, message: 'Order cancelled successfully' });
  } catch (err: any) {
    console.error('Failed to cancel order:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
