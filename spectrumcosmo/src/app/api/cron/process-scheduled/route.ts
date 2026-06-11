// app/api/cron/process-scheduled/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { getAllCustomerIds } from '@/lib/notifications-admin';
import { sendAdminNotificationEmail } from '@/lib/notification-email';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const scheduled = await queryMany`
    SELECT * FROM admin_notifications
    WHERE status = 'scheduled' 
      AND scheduled_for <= NOW()
      AND is_deleted = FALSE
  `;
  
  let processed = 0;
  
  for (const notification of scheduled) {
    let customerIds: string[] = [];
    
    if (notification.audience_type === 'all') {
      customerIds = await getAllCustomerIds();
    } else {
      customerIds = notification.specific_customer_ids 
        ? JSON.parse(notification.specific_customer_ids) 
        : [];
    }
    
    if (customerIds.length === 0) {
      await queryMany`
        UPDATE admin_notifications 
        SET status = 'sent', sent_at = NOW()
        WHERE id = ${notification.id}::uuid
      `;
      continue;
    }
    
    // Insert recipients - FIXED: use notification_id
    const batchSize = 100;
    for (let i = 0; i < customerIds.length; i += batchSize) {
      const batch = customerIds.slice(i, i + batchSize);
      for (const customerId of batch) {
        await queryMany`
          INSERT INTO notification_recipients (notification_id, customer_id)
          VALUES (${notification.id}::uuid, ${customerId}::uuid)
          ON CONFLICT (notification_id, customer_id, created_at) DO NOTHING
        `;
      }
    }
    
    // Get customer details for email
    const customers = await queryMany`
      SELECT id, name, email FROM users WHERE id = ANY(${customerIds})
    `;
    
    // Send emails
    for (const customer of customers) {
      if (customer.email) {
        const settings = await queryMany`
          SELECT email_enabled FROM customer_notification_settings
          WHERE customer_id = ${customer.id}::uuid
        `;
        
        const emailEnabled = settings.length === 0 ? true : settings[0]?.email_enabled;
        
        if (emailEnabled) {
          await sendAdminNotificationEmail({
            to: customer.email,
            name: customer.name || 'Customer',
            title: notification.title,
            message: notification.body,
          });
        }
      }
    }
    
    await queryMany`
      UPDATE admin_notifications 
      SET status = 'sent', sent_at = NOW()
      WHERE id = ${notification.id}::uuid
    `;
    
    processed++;
  }
  
  return NextResponse.json({ 
    success: true, 
    processed,
    timestamp: new Date().toISOString()
  });
}
