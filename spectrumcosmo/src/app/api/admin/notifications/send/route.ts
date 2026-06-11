import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryMany } from '@/lib/db';
import { createNotification, getAllCustomerIds } from '@/lib/notifications-admin';
import { sendAdminNotificationEmail } from '@/lib/notification-email';

export async function POST(req: NextRequest) {
  try {
    console.log('=== SEND NOTIFICATION START ===');
    
    const authError = await requireAdmin(req);
    if (authError) {
      console.log('Auth error:', authError);
      return authError;
    }
    
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { title, body: messageBody, audience_type, specific_customer_ids } = body;
    
    if (!title || !messageBody) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }
    
    let customerIds: string[] = [];
    if (audience_type === 'all') {
      console.log('Fetching all customer IDs...');
      customerIds = await getAllCustomerIds();
      console.log(`Found ${customerIds.length} customers`);
    } else {
      customerIds = specific_customer_ids || [];
      console.log(`Specific customers: ${customerIds.length} IDs`);
    }
    
    if (customerIds.length === 0) {
      return NextResponse.json({ success: true, recipients: 0, message: 'No customers to send to' });
    }
    
    console.log('Creating notification record...');
    const notificationId = await createNotification({
      title,
      body: messageBody,
      audience_type,
      specific_customer_ids: audience_type === 'specific' ? specific_customer_ids : undefined,
      status: 'sent',
      sent_by: 'spectrumcosmo team',
    });
    console.log(`Notification created: ${notificationId}`);
    
    console.log('Inserting recipients...');
    const batchSize = 100;
    for (let i = 0; i < customerIds.length; i += batchSize) {
      const batch = customerIds.slice(i, i + batchSize);
      for (const customerId of batch) {
        try {
          await queryMany`
            INSERT INTO notification_recipients (notification_id, customer_id)
            VALUES (${notificationId}::uuid, ${customerId}::uuid)
            ON CONFLICT (notification_id, customer_id, created_at) DO NOTHING
          `;
        } catch (insertErr) {
          console.error(`Failed to insert recipient ${customerId}:`, insertErr);
          throw insertErr;
        }
      }
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}`);
    }
    
    console.log('Fetching customer emails...');
    const customers = await queryMany`
      SELECT id, name, email FROM users WHERE id = ANY(${customerIds})
    `;
    console.log(`Found ${customers.length} customers with email`);
    
    // Send emails asynchronously (don't await)
    console.log('Sending emails...');
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
            console.log(`Email sent to ${customer.email}`);
          }
        } catch (emailErr) {
          console.error(`Email failed for ${customer.email}:`, emailErr);
        }
      })
    ).catch(console.error);
    
    console.log('Updating sent_at...');
    await queryMany`
      UPDATE admin_notifications 
      SET sent_at = NOW()
      WHERE id = ${notificationId}::uuid
    `;
    
    console.log('=== SEND SUCCESS ===');
    return NextResponse.json({ success: true, notificationId, recipients: customerIds.length });
    
  } catch (err) {
    console.error('=== SEND FAILED ===');
    console.error('Error details:', err);
    return NextResponse.json(
      { error: 'Failed to send notification', details: String(err) },
      { status: 500 }
    );
  }
}
