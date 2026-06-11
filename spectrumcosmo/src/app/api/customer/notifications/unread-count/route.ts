import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/auth';
import { queryMany } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;
  if (!user) return NextResponse.json({ count: 0 });
  
  // Count unread admin notifications
  const adminNotifications = await queryMany`
    SELECT COUNT(*) as count
    FROM notification_recipients r
    JOIN admin_notifications n ON n.id = r.admin_notification_id
    WHERE r.customer_id = ${user.id}
      AND r.is_read = FALSE
      AND n.status = 'sent'
      AND n.sent_at IS NOT NULL
  `;
  
  const total = Number(adminNotifications[0]?.count) || 0;
  
  return NextResponse.json({ count: total });
}
