import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryMany } from '@/lib/db';
import { createNotification, getAllCustomerIds } from '@/lib/notifications-admin';
import { sendAdminNotificationEmail } from '@/lib/notification-email';

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

  // Insert recipients with partition key (created_at)
  for (const customerId of customerIds) {
    await queryMany`
      INSERT INTO notification_recipients (notification_id, customer_id, created_at, delivered_at)
      VALUES (${notificationId}::uuid, ${customerId}::uuid, NOW(), NOW())
      ON CONFLICT (notification_id, customer_id, created_at) DO NOTHING
    `;
  }

  // Update sent_at timestamp
  await queryMany`
    UPDATE admin_notifications 
    SET sent_at = NOW()
    WHERE id = ${notificationId}::uuid
  `;

  // Send emails in background (don't await to avoid timeout)
  const customers = await queryMany`
    SELECT id, name, email FROM users WHERE id = ANY(${customerIds})
  `;
  
  Promise.all(
    customers.map(async (customer: any) => {
      try {
        const settings = await queryMany`
          SELECT email_enabled FROM customer_notification_settings
          WHERE customer_id = ${customer.id}::uuid
        `;
        const emailEnabled = settings.length === 0 ? true : settings[0]?.email_enabled;
        if (emailEnabled && customer.email) {
          await sendAdminNotificationEmail({
            to: customer.email,
            name: customer.name || 'Customer',
            title,
            message: messageBody,
          });
        }
      } catch (err) {
        console.error(`Email failed for ${customer.email}:`, err);
      }
    })
  ).catch(console.error);

  return NextResponse.json({
    success: true,
    notificationId,
    recipients: customerIds.length,
  });
}
