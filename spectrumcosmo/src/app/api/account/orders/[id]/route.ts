import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  try {
    const sql = getDb();
    
    const [order] = await sql`
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
      WHERE id = ${params.id} AND (user_id = ${user.id} OR customer_email = ${user.email})
    `;
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    return NextResponse.json(order);
  } catch (err: any) {
    console.error('Failed to fetch order:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
