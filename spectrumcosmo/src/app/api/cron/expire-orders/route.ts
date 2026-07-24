// app/api/cron/expire-orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';
import { releaseReservedStock } from '@/lib/order-utils';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();

    const expiredOrders = await queryAsArray<{ id: string }>`
      SELECT id::text FROM orders
      WHERE status = 'pending'
        AND stock_deducted = true
        AND expires_at IS NOT NULL
        AND expires_at < NOW()
    `;

    let released = 0;
    for (const order of expiredOrders) {
      await releaseReservedStock(order.id);
      await sql`
        UPDATE orders 
        SET status = 'expired', stock_deducted = false, updated_at = NOW()
        WHERE id = ${order.id}::uuid
      `;
      released++;
    }

    return NextResponse.json({ success: true, released });
  } catch (err) {
    console.error('Failed to expire orders:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
