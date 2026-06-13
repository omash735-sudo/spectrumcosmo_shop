import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryMany, queryOne } from '@/lib/db';
import { createNotification } from '@/lib/notifications-admin';
import { sendAdminNotificationEmail } from '@/lib/notification-email';

// Helper to get all customer IDs (no deleted_at condition)
async function getAllCustomerIds(): Promise<string[]> {
  const results = await queryMany`SELECT id FROM users`;
  return results.map((r: any) => r.id);
}

export async function POST(req: NextRequest) {
  try {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const body = await req.json();
    const { title, body: messageBody, icon_name, audience_type, specific_customer_ids } = body;

    if (!title || !messageBody) {
      return NextResponse.json({ error: 'Title and message required' }, { status: 400 });
    }

    // Get customer IDs
    let customerIds: string[] = [];
    if (audience_type === 'all') {
      customerIds = await getAllCustomerIds();
      console.log(`[Send] All customers count: ${customerIds.length}`);
    } else {
      customerIds = specific_customer_ids || [];
      console.log(`[Send] Specific customers count: ${customerIds.length}`);
    }

    if (customerIds.length === 0) {
      return NextResponse.json({ success: true, recipients: 0, message: 'No customers to send to' });
    }

    // Create notification record with icon_name
    const notificationId = await createNotification({
      title,
      body: messageBody,
      icon_name: icon_name || 'bell',
      audience_type,
      specific_customer_ids: audience_type === 'specific' ? specific_customer_ids : undefined,
      status: 'sent',
      sent_by: 'spectrumcosmo team',
    });
    console.log(`[Send] Notification created: ${notificationId}`);

    // Insert recipients one by one (simpler and avoids partition key issues)
    let insertedCount = 0;
    for (const customerId of customerIds) {
      try {
        await queryMany`
          INSERT INTO notification_recipients (notification_id, customer_id, created_at, delivered_at, is_read)
          VALUES (${notificationId}::uuid, ${customerId}::uuid, NOW(), NOW(), FALSE)
          ON CONFLICT (notification_id, customer_id, created_at) DO NOTHING
        `;
        insertedCount++;
      } catch (err) {
        console.error(`[Send] Failed to insert customer ${customerId}:`, err);
      }
    }
    console.log(`[Send] Inserted ${insertedCount} recipients`);

    // Update sent_at timestamp
    await queryMany`
      UPDATE admin_notifications SET sent_at = NOW()
      WHERE id = ${notificationId}::uuid
    `;

    // Send emails in background (don't await)
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
        } catch (emailErr) {
          console.error(`[Send] Email failed for ${customer.email}:`, emailErr);
        }
      })
    ).catch(console.error);

    return NextResponse.json({
      success: true,
      notificationId,
      recipients: insertedCount,
    });
  } catch (err: any) {
    console.error('[Send] Fatal error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error', details: err.toString() },
      { status: 500 }
    );
  }
}
