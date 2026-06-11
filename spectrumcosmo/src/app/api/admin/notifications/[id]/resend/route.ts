import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryMany } from '@/lib/db';
import { 
  getNotificationById, 
  getUnreadCustomerIds, 
  createNotification 
} from '@/lib/notifications-admin';
import { sendAdminNotificationEmail } from '@/lib/notification-email';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdmin(req);
  if (authError) return authError;
  
  const original = await getNotificationById(params.id);
  if (!original) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }
  
  const unreadCustomerIds = await getUnreadCustomerIds(params.id);
  
  if (unreadCustomerIds.length === 0) {
    return NextResponse.json({ 
      success: true, 
      recipients: 0,
      message: 'No unread customers to resend to'
    });
  }
  
  // Create a new reminder notification
  const reminderId = await createNotification({
    title: `[REMINDER] ${original.title}`,
    body: original.body,
    audience_type: 'specific',
    specific_customer_ids: unreadCustomerIds,
    status: 'sent',
    sent_by: 'spectrumcosmo team',
  });
  
  // Insert recipients in batches
  const batchSize = 100;
  for (let i = 0; i < unreadCustomerIds.length; i += batchSize) {
    const batch = unreadCustomerIds.slice(i, i + batchSize);
    for (const customerId of batch) {
      await queryMany`
        INSERT INTO notification_recipients (admin_notification_id, customer_id)
        VALUES (${reminderId}, ${customerId})
        ON CONFLICT (admin_notification_id, customer_id, created_at) DO NOTHING
      `;
    }
  }
  
  // Get customer details for email
  const customers = await queryMany`
    SELECT id, name, email FROM users WHERE id = ANY(${unreadCustomerIds})
  `;
  
  // Send emails
  Promise.all(
    customers.map(async (customer: any) => {
      const settings = await queryMany`
        SELECT email_enabled FROM customer_notification_settings
        WHERE customer_id = ${customer.id}
      `;
      
      const emailEnabled = settings.length === 0 ? true : settings[0].email_enabled;
      
      if (emailEnabled && customer.email) {
        await sendAdminNotificationEmail({
          to: customer.email,
          name: customer.name || 'Customer',
          title: `[REMINDER] ${original.title}`,
          message: original.body,
        });
      }
    })
  ).catch(console.error);
  
  await queryMany`
    UPDATE admin_notifications 
    SET sent_at = NOW()
    WHERE id = ${reminderId}
  `;
  
  return NextResponse.json({ 
    success: true, 
    reminderId,
    recipients: unreadCustomerIds.length
  });
}
