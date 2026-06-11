import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryMany } from '@/lib/db';
import { createNotification, getAllCustomerIds } from '@/lib/notifications-admin';
import { sendAdminNotificationEmail } from '@/lib/notification-email';

export async function POST(req: NextRequest) {
  try {
    console.log('=== SEND START ===');
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const body = await req.json();
    console.log('Body:', body);

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

    // Create notification
    const notificationId = await createNotification({
      title,
      body: messageBody,
      audience_type,
      specific_customer_ids: audience_type === 'specific' ? specific_customer_ids : undefined,
      status: 'sent',
      sent_by: 'spectrumcosmo team',
    });
    console.log('Notification created:', notificationId);

    // Insert recipients
    for (const customerId of customerIds) {
      await queryMany`
        INSERT INTO notification_recipients (notification_id, customer_id)
        VALUES (${notificationId}::uuid, ${customerId}::uuid)
        ON CONFLICT (notification_id, customer_id, created_at) DO NOTHING
      `;
    }
    console.log('Recipients inserted');

    // Update sent_at
    await queryMany`
      UPDATE admin_notifications SET sent_at = NOW()
      WHERE id = ${notificationId}::uuid
    `;

    // Send emails in background (don't await)
    const customers = await queryMany`
      SELECT id, name, email FROM users WHERE id = ANY(${customerIds})
    `;
    Promise.all(customers.map(async (c: any) => {
      try {
        const settings = await queryMany`
          SELECT email_enabled FROM customer_notification_settings
          WHERE customer_id = ${c.id}::uuid
        `;
        const emailEnabled = settings.length === 0 ? true : settings[0]?.email_enabled;
        if (emailEnabled && c.email) {
          await sendAdminNotificationEmail({
            to: c.email,
            name: c.name || 'Customer',
            title,
            message: messageBody,
          });
        }
      } catch (e) { console.error('Email error:', e); }
    })).catch(console.error);

    console.log('=== SEND SUCCESS ===');
    return NextResponse.json({ success: true, notificationId, recipients: customerIds.length });
  } catch (err: any) {
    console.error('=== SEND ERROR ===', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message, stack: err.stack },
      { status: 500 }
    );
  }
}
