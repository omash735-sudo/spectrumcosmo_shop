import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const sql = getDb();

    // Get order with payment info - using correct column names
    const [order] = await sql`
      SELECT 
        o.id,
        o.customer_name,
        o.total_amount,
        o.payment_status,
        o.payment_method,
        o.payment_provider_id,
        o.proof_of_payment_url,
        o.payment_note,
        p.name as provider_name,
        p.type as provider_type,
        p.category as provider_category,
        p.account_name,
        p.account_number,
        p.branch,
        p.instructions
      FROM orders o
      LEFT JOIN payment_providers p ON p.id = o.payment_provider_id
      WHERE o.id::text = ${orderId}
    `;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get payment confirmations
    let confirmations = [];
    try {
      confirmations = await sql`
        SELECT * FROM payment_confirmations
        WHERE order_id = ${orderId}
        ORDER BY submitted_at DESC
      `;
    } catch (err) {
      console.log('payment_confirmations table not yet created');
    }

    return NextResponse.json({
      order: {
        id: order.id,
        customer_name: order.customer_name,
        total_amount: order.total_amount,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
      },
      provider: order.provider_name ? {
        name: order.provider_name,
        type: order.provider_type,
        category: order.provider_category,
        account_name: order.account_name,
        account_number: order.account_number,
        branch: order.branch,
        instructions: order.instructions,
      } : null,
      existing_proof: order.proof_of_payment_url,
      existing_note: order.payment_note,
      confirmations,
    });
  } catch (err: any) {
    console.error('Payment status error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
