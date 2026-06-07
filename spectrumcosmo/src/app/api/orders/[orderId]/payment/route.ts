// app/api/orders/[orderId]/payment-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne, queryAsArray } from '@/lib/db';

interface OrderWithProvider {
  id: string;
  customer_name: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  payment_provider_id: string | null;
  proof_of_payment_url: string | null;
  payment_note: string | null;
  provider_name: string | null;
  provider_type: string | null;
  provider_category: string | null;
  account_name: string | null;
  account_number: string | null;
  branch: string | null;
  instructions: string | null;
}

interface PaymentConfirmation {
  id: string;
  order_id: string;
  proof_image_url: string;
  transaction_reference: string | null;
  notes: string | null;
  status: string;
  submitted_at: Date;
  reviewed_at: Date | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const sql = getDb();

    // Get order with payment info – use queryOne for single row
    const order = await queryOne<OrderWithProvider>`
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

    // Get payment confirmations – use queryAsArray to get a real array
    let confirmations: PaymentConfirmation[] = [];
    try {
      confirmations = await queryAsArray<PaymentConfirmation>`
        SELECT * FROM payment_confirmations
        WHERE order_id = ${orderId}
        ORDER BY submitted_at DESC
      `;
    } catch (err) {
      console.log('payment_confirmations table not yet created:', err);
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
  } catch (err) {
    console.error('Payment status error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
