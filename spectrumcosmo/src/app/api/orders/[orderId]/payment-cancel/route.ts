import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    
    // Optional: Verify user ownership
    const { user, error } = await getVerifiedUser(req);
    
    const sql = getDb();

    // First, check if order exists and belongs to user (if logged in)
    let order;
    if (user) {
      const [found] = await sql`
        SELECT id, payment_status FROM orders 
        WHERE id::text = ${orderId} AND (user_id = ${user.id} OR customer_email = ${user.email})
      `;
      order = found;
    } else {
      const [found] = await sql`
        SELECT id, payment_status FROM orders 
        WHERE id::text = ${orderId}
      `;
      order = found;
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only allow cancellation if payment is pending or awaiting verification
    if (order.payment_status !== 'pending' && order.payment_status !== 'awaiting_verification') {
      return NextResponse.json({ error: 'Cannot cancel proof at this stage' }, { status: 400 });
    }

    // Update order - using correct column names (proof_of_payment_url, not proof_of_payment)
    await sql`
      UPDATE orders 
      SET 
        proof_of_payment_url = NULL, 
        payment_note = NULL, 
        payment_status = 'pending',
        status = 'pending',
        updated_at = NOW()
      WHERE id::text = ${orderId}
    `;

    // Update payment_confirmations table if it exists
    try {
      await sql`
        UPDATE payment_confirmations
        SET status = 'cancelled', reviewed_at = NOW()
        WHERE order_id = ${orderId}
      `;
    } catch (err) {
      console.log('payment_confirmations table not yet created');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Proof removed successfully. You can upload a new proof.' 
    });
  } catch (err: any) {
    console.error('Cancel proof error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
