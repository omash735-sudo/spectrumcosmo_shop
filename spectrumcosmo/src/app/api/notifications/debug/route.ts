import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/auth';
import { queryMany } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  // Check admin_notifications for this customer
  const adminNotifs = await queryMany`
    SELECT 
      n.id,
      n.title,
      n.body,
      n.status,
      n.sent_at,
      r.is_read,
      r.customer_id
    FROM admin_notifications n
    LEFT JOIN notification_recipients r ON r.notification_id = n.id AND r.customer_id = ${user.id}::uuid
    WHERE n.status = 'sent'
    ORDER BY n.sent_at DESC
    LIMIT 10
  `;

  // Check user_notifications
  const userNotifs = await queryMany`
    SELECT id, title, message, type, is_read, created_at
    FROM user_notifications
    WHERE user_id = ${user.id}::uuid
    ORDER BY created_at DESC
    LIMIT 10
  `;

  return NextResponse.json({
    customerId: user.id,
    adminNotifications: adminNotifs,
    userNotifications: userNotifs,
    adminCount: adminNotifs.length,
    userCount: userNotifs.length,
  });
}
