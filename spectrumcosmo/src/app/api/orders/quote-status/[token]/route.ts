import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const sql = getDb();
    const order = await queryOne<{
      id: string;
      delivery_quote_status: string;
      quoted_delivery_fee: number;
      payment_status: string;
      status: string;
    }>`
      SELECT id::text, delivery_quote_status, quoted_delivery_fee, payment_status, status
      FROM orders
      WHERE delivery_quote_token = ${token}
    `;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      orderId: order.id,
      quoteStatus: order.delivery_quote_status,
      quotedFee: order.quoted_delivery_fee,
      paymentStatus: order.payment_status,
      orderStatus: order.status,
    });
  } catch (err) {
    console.error('Quote status error:', err);
    return NextResponse.json({ error: 'Failed to get quote status' }, { status: 500 });
  }
}
