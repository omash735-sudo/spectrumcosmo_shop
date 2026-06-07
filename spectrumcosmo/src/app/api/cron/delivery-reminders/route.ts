// app/api/cron/delivery-reminders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';
import { createNotification } from '@/lib/notifications';

const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key';

interface OrderToRemind {
  id: string;
  user_id: string;
  customer_name: string;
  order_number: string | null;
  delivered_at: Date;
  confirmation_days: number;
  reminder_count: number | null;
  last_reminder_at: Date | null;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();

    const ordersToRemind = await queryAsArray<OrderToRemind>`
      SELECT 
        o.id, 
        o.user_id, 
        o.customer_name, 
        o.order_number,
        o.delivered_at,
        dm.confirmation_days,
        dc.reminder_count,
        dc.last_reminder_at
      FROM orders o
      JOIN delivery_methods dm ON dm.id = o.delivery_method_id
      LEFT JOIN delivery_confirmations dc ON dc.order_id = o.id
      WHERE o.status = 'delivered'
        AND o.delivered_at IS NOT NULL
        AND o.delivered_at < NOW() - (dm.confirmation_days || ' days')::INTERVAL
        AND (dc.id IS NULL OR (dc.response IS NULL AND dc.reminder_count < 3))
    `;

    let reminded = 0;

    for (const order of ordersToRemind) {
      const reminderCount = (order.reminder_count ?? 0) + 1;

      await sql`
        INSERT INTO delivery_confirmations (order_id, asked_at, reminder_count, last_reminder_at)
        VALUES (${order.id}, NOW(), ${reminderCount}, NOW())
        ON CONFLICT (order_id) DO UPDATE 
        SET reminder_count = EXCLUDED.reminder_count,
            last_reminder_at = EXCLUDED.last_reminder_at,
            asked_at = COALESCE(delivery_confirmations.asked_at, EXCLUDED.asked_at)
      `;

      await createNotification({
        userId: order.user_id,
        title: 'Did you receive your order?',
        message: `Hi ${order.customer_name}, did you receive your order #${order.order_number?.slice(-8) || order.id.slice(-8)}? Please let us know.`,
        type: 'delivery_confirmation',
        actionUrl: `/account/orders/${order.id}/confirm`,
        actionLabel: 'Confirm Delivery',
      });

      reminded++;
    }

    return NextResponse.json({
      success: true,
      reminded,
      totalPending: ordersToRemind.length,
    });
  } catch (err) {
    console.error('Delivery reminder error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
