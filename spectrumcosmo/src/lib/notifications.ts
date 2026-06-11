// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/auth';
import { 
  getUserNotifications, 
  getUnreadNotificationCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '@/lib/notifications';
import { queryMany } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  // 1. Get existing notifications from user_notifications table
  const existingNotifications = await getUserNotifications(user.id, limit, offset);
  const existingUnreadCount = await getUnreadNotificationCount(user.id);

  // 2. Get admin notifications from the new system
  const adminNotifications = await queryMany`
    SELECT 
      n.id,
      n.title,
      n.body as message,
      'admin' as type,
      n.sent_at as created_at,
      r.is_read,
      '/account/notifications' as action_url,
      'View Details' as action_label
    FROM admin_notifications n
    JOIN notification_recipients r ON r.notification_id = n.id
    WHERE r.customer_id = ${user.id}::uuid
      AND n.status = 'sent'
      AND n.sent_at IS NOT NULL
    ORDER BY n.sent_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  // 3. Count unread admin notifications
  const adminUnreadResult = await queryMany`
    SELECT COUNT(*) as count
    FROM notification_recipients r
    JOIN admin_notifications n ON n.id = r.notification_id
    WHERE r.customer_id = ${user.id}::uuid
      AND r.is_read = FALSE
      AND n.status = 'sent'
  `;
  const adminUnreadCount = Number(adminUnreadResult[0]?.count) || 0;

  // 4. Transform existing notifications to match the format
  const formattedExisting = existingNotifications.map((n: any) => ({
    id: `user_${n.id}`,  // Prefix to distinguish from admin notifications
    title: n.title,
    message: n.message,
    type: n.type,
    created_at: n.created_at,
    is_read: n.is_read,
    action_url: n.action_url,
    action_label: n.action_label,
  }));

  // 5. Format admin notifications
  const formattedAdmin = adminNotifications.map((n: any) => ({
    id: `admin_${n.id}`,  // Prefix to distinguish
    title: n.title,
    message: n.message,
    type: n.type,
    created_at: n.created_at,
    is_read: n.is_read,
    action_url: n.action_url,
    action_label: n.action_label,
  }));

  // 6. Merge and sort
  const allNotifications = [...formattedExisting, ...formattedAdmin];
  allNotifications.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // 7. Apply pagination
  const paginated = allNotifications.slice(offset, offset + limit);
  const totalUnread = existingUnreadCount + adminUnreadCount;

  return NextResponse.json({
    notifications: paginated,
    unreadCount: totalUnread,
    hasMore: paginated.length === limit,
  });
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  const { notificationId, markAll } = await req.json();

  if (markAll) {
    // Mark all existing user_notifications as read
    await markAllNotificationsAsRead(user.id);
    
    // Mark all admin notifications as read
    await queryMany`
      UPDATE notification_recipients
      SET is_read = TRUE, read_at = NOW()
      WHERE customer_id = ${user.id}::uuid AND is_read = FALSE
    `;
    
    return NextResponse.json({ success: true, markAll: true });
  }

  if (notificationId) {
    // Check if it's a user notification (starts with "user_")
    if (notificationId.startsWith('user_')) {
      const numericId = parseInt(notificationId.replace('user_', ''));
      await markNotificationAsRead(numericId, user.id);
    }
    
    // Check if it's an admin notification (starts with "admin_")
    if (notificationId.startsWith('admin_')) {
      const uuidId = notificationId.replace('admin_', '');
      await queryMany`
        UPDATE notification_recipients
        SET is_read = TRUE, read_at = NOW()
        WHERE notification_id = ${uuidId}::uuid AND customer_id = ${user.id}::uuid
      `;
    }
    
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}
