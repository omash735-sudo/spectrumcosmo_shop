import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('OneKhusa webhook payload:', payload);

    // Optional: verify webhook signature if OneKhusa provides one
    // const signature = req.headers.get('x-webhook-signature');
    // if (signature !== process.env.ONEKHUSA_WEBHOOK_SECRET) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const { status, transactionReference } = payload;
    const isSuccess = status === 'SUCCESS' || status === 'SUCCESSFUL';

    if (isSuccess && transactionReference) {
      const sql = getDb();
      await sql`
        UPDATE orders
        SET status = 'approved', paid_at = NOW()
        WHERE id = ${transactionReference} AND status = 'pending'
      `;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
