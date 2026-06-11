import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/auth';
import { queryMany } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;
  if (!user) return NextResponse.json({ count: 0 });
  
  // Unread from user_notifications
  const userUnread = await queryMany`
    SELECT COUNT(*) as count
    FROM user_notifications
    WHERE user_id = ${user.id}::uuid AND is_read = FALSE
  `;
  const userCount = Number(userUnread[0]?.count) || 0;
  
  // Unread from admin_notifications
  const adminUnread = await queryMany`
    SELECT COUNT(*) as count
    FROM notification_recipients r
    JOIN admin_notifications n ON n.id = r.notification_id
    WHERE r.customer_id = ${user.id}::uuid
      AND r.is_read = FALSE
      AND n.status = 'sent'
  `;
  const adminCount = Number(adminUnread[0]?.count) || 0;
  
  return NextResponse.json({ count: userCount + adminCount });
}
