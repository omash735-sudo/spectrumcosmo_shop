import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { getAllCustomerIds } from '@/lib/notifications-admin';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const scheduled = await queryMany`
    SELECT * FROM admin_notifications
    WHERE status = 'scheduled' AND scheduled_for <= NOW() AND is_deleted = FALSE
  `;

  let processed = 0;
  for (const notification of scheduled) {
    let customerIds: string[] = [];
    if (notification.audience_type === 'all') {
      customerIds = await getAllCustomerIds();
    } else {
      customerIds = notification.specific_customer_ids ? JSON.parse(notification.specific_customer_ids) : [];
    }
    if (customerIds.length === 0) {
      await queryMany`UPDATE admin_notifications SET status = 'sent', sent_at = NOW() WHERE id = ${notification.id}`;
      continue;
    }

    for (const customerId of customerIds) {
      await queryMany`
        INSERT INTO notification_recipient (notification_id, customer_id, created_at, delivered_at)
        VALUES (${notification.id}::uuid, ${customerId}::uuid, NOW(), NOW())
        ON CONFLICT (notification_id, customer_id, created_at) DO NOTHING
      `;
    }

    await queryMany`
      UPDATE admin_notifications SET status = 'sent', sent_at = NOW()
      WHERE id = ${notification.id}
    `;
    processed++;
  }
  return NextResponse.json({ success: true, processed, timestamp: new Date().toISOString() });
}
