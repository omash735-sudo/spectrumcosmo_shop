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
    return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
  }
  
  // Get customer IDs based on audience
  let customerIds: string[] = [];
  if (audience_type === 'all') {
    customerIds = await getAllCustomerIds();
  } else {
    customerIds = specific_customer_ids || [];
  }
  
  if (customerIds.length === 0) {
    return NextResponse.json({ 
      success: true, 
      recipients: 0,
      message: 'No customers to send to'
    });
  }
  
  // Create notification record
  const notificationId = await createNotification({
    title,
    body: messageBody,
    audience_type,
    specific_customer_ids: audience_type === 'specific' ? specific_customer_ids : undefined,
    status: 'sent',
    sent_by: 'spectrumcosmo team',
  });
  
  // Insert recipients
  for (const customerId of customerIds) {
    await queryMany`
      INSERT INTO notification_recipients (admin_notification_id, customer_id)
      VALUES (${notificationId}, ${customerId})
      ON CONFLICT (admin_notification_id, customer_id, created_at) DO NOTHING
    `;
  }
  
  // Get customer details for email
  const customers = await queryMany`
    SELECT id, name, email FROM users WHERE id = ANY(${customerIds})
  `;
  
  // Send emails (async, don't block response)
  Promise.all(
    customers.map(async (customer: any) => {
      const settings = await queryMany`
        SELECT email_enabled FROM customer_notification_settings
        WHERE customer_id = ${customer.id}
      `;
      
      if ((settings[0]?.email_enabled !== false) && customer.email) {
        await sendAdminNotificationEmail({
          to: customer.email,
          name: customer.name || 'Customer',
          title,
          message: messageBody,
        });
      }
    })
  ).catch(console.error);
  
  // Update sent_at timestamp
  await queryMany`
    UPDATE admin_notifications 
    SET sent_at = NOW()
    WHERE id = ${notificationId}
  `;
  
  return NextResponse.json({ 
    success: true, 
    notificationId, 
    recipients: customerIds.length 
  });
}
