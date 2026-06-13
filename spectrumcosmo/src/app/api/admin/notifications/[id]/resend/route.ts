import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryMany } from '@/lib/db';
import { getNotificationById, getUnreadCustomerIds, createNotification } from '@/lib/notifications-admin';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  const { id } = await params;

  const original = await getNotificationById(id);
  if (!original) return NextResponse.json({ error: 'Notification not found' }, { status: 404 });

  const unreadCustomerIds = await getUnreadCustomerIds(id);
  if (unreadCustomerIds.length === 0) {
    return NextResponse.json({ success: true, recipients: 0, message: 'No unread customers' });
  }

  const reminderId = await createNotification({
    title: `[REMINDER] ${original.title}`,
    body: original.body,
    audience_type: 'specific',
    specific_customer_ids: unreadCustomerIds,
    status: 'sent',
    sent_by: 'spectrumcosmo team',
  });

  for (const customerId of unreadCustomerIds) {
    await queryMany`
      INSERT INTO notification_recipient (notification_id, customer_id, created_at, delivered_at)
      VALUES (${reminderId}::uuid, ${customerId}::uuid, NOW(), NOW())
      ON CONFLICT (notification_id, customer_id, created_at) DO NOTHING
    `;
  }

  await queryMany`
    UPDATE admin_notifications SET sent_at = NOW()
    WHERE id = ${reminderId}::uuid
  `;

  return NextResponse.json({ success: true, reminderId, recipients: unreadCustomerIds.length });
}
