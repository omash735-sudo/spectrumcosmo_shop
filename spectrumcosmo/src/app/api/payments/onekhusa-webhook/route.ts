import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('OneKhusa webhook payload:', JSON.stringify(payload, null, 2));

    // Map webhook fields (adjust based on actual payload)
    const { status, transactionId, amount, paymentMethod, referenceNumber } = payload;
    const isSuccess = status === 'SUCCESS' || status === 'SUCCESSFUL';

    if (isSuccess && transactionId) {
      const sql = getDb();
      const [order] = await sql`
        SELECT id FROM orders WHERE onekhusa_transaction_id = ${transactionId}
      `;
      if (order) {
        await sql`
          UPDATE orders
          SET status = 'approved',
              paid_at = NOW(),
              payment_method = COALESCE(${paymentMethod}, payment_method),
              total_amount = COALESCE(${amount}, total_amount)
          WHERE id = ${order.id}
        `;
        console.log(`Order ${order.id} marked as approved via webhook`);
      } else {
        console.warn('Order not found for transactionId:', transactionId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
