import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryMany } from '@/lib/db';
import { createNotification, getAllCustomerIds } from '@/lib/notifications-admin';

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const body = await req.json();
  const { title, body: messageBody, audience_type, specific_customer_ids } = body;

  if (!title || !messageBody) {
    return NextResponse.json({ error: 'Title and message required' }, { status: 400 });
  }

  let customerIds: string[] = [];
  if (audience_type === 'all') {
    customerIds = await getAllCustomerIds();
  } else {
    customerIds = specific_customer_ids || [];
  }

  if (customerIds.length === 0) {
    return NextResponse.json({ success: true, recipients: 0 });
  }

  const notificationId = await createNotification({
    title,
    body: messageBody,
    audience_type,
    specific_customer_ids: audience_type === 'specific' ? specific_customer_ids : undefined,
    status: 'sent',
    sent_by: 'spectrumcosmo team',
  });

  for (const customerId of customerIds) {
    await queryMany`
      INSERT INTO notification_recipient (notification_id, customer_id, created_at, delivered_at)
      VALUES (${notificationId}::uuid, ${customerId}::uuid, NOW(), NOW())
      ON CONFLICT (notification_id, customer_id, created_at) DO NOTHING
    `;
  }

  await queryMany`
    UPDATE admin_notifications SET sent_at = NOW()
    WHERE id = ${notificationId}::uuid
  `;

  return NextResponse.json({ success: true, notificationId, recipients: customerIds.length });
}
