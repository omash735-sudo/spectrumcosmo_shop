import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/auth';
import { queryMany } from '@/lib/db';
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/notifications';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  // 1. User notifications (order updates, delivery confirmations, etc.)
  const userNotifications = await getUserNotifications(user.id, limit, offset);
  const userUnreadCount = await getUnreadNotificationCount(user.id);

  // 2. Admin notifications (messages sent by admin to this customer)
  const adminNotifications = await queryMany`
    SELECT 
      n.id,
      n.title,
      n.body as message,
      'admin' as type,
      COALESCE(n.sent_at, n.created_at) as created_at,
      r.is_read,
      '/account/notifications' as action_url,
      'View Details' as action_label
    FROM admin_notifications n
    JOIN notification_recipients r ON r.notification_id = n.id
    WHERE r.customer_id = ${user.id}::uuid
      AND n.status = 'sent'
      AND (n.sent_at IS NOT NULL OR n.created_at IS NOT NULL)
    ORDER BY COALESCE(n.sent_at, n.created_at) DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  // 3. Unread count for admin notifications
  const adminUnreadResult = await queryMany`
    SELECT COUNT(*) as count
    FROM notification_recipients r
    JOIN admin_notifications n ON n.id = r.notification_id
    WHERE r.customer_id = ${user.id}::uuid
      AND r.is_read = FALSE
      AND n.status = 'sent'
  `;
  const adminUnreadCount = Number(adminUnreadResult[0]?.count) || 0;

  // 4. Format user notifications (numeric id)
  const formattedUser = userNotifications.map((n: any) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    created_at: n.created_at,
    is_read: n.is_read,
    action_url: n.action_url,
    action_label: n.action_label,
  }));

  // 5. Format admin notifications (prefix id to avoid collision)
  const formattedAdmin = adminNotifications.map((n: any) => ({
    id: `admin_${n.id}`,
    title: n.title,
    message: n.message,
    type: n.type,
    created_at: n.created_at,
    is_read: n.is_read,
    action_url: n.action_url,
    action_label: n.action_label,
  }));

  // 6. Merge and sort newest first
  const allNotifications = [...formattedUser, ...formattedAdmin];
  allNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // 7. Apply pagination
  const paginated = allNotifications.slice(offset, offset + limit);
  const totalUnread = userUnreadCount + adminUnreadCount;

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
    // Mark all user notifications as read
    await markAllNotificationsAsRead(user.id);
    // Mark all admin notifications as read for this customer
    await queryMany`
      UPDATE notification_recipients
      SET is_read = TRUE, read_at = NOW()
      WHERE customer_id = ${user.id}::uuid AND is_read = FALSE
    `;
    return NextResponse.json({ success: true, markAll: true });
  }

  if (notificationId) {
    // User notification (numeric id)
    if (typeof notificationId === 'number' || !isNaN(Number(notificationId))) {
      await markNotificationAsRead(Number(notificationId), user.id);
    }
    // Admin notification (starts with 'admin_')
    else if (typeof notificationId === 'string' && notificationId.startsWith('admin_')) {
      const uuid = notificationId.replace('admin_', '');
      await queryMany`
        UPDATE notification_recipients
        SET is_read = TRUE, read_at = NOW()
        WHERE notification_id = ${uuid}::uuid AND customer_id = ${user.id}::uuid
      `;
    }
    // Fallback: treat as direct UUID
    else {
      await queryMany`
        UPDATE notification_recipients
        SET is_read = TRUE, read_at = NOW()
        WHERE notification_id = ${notificationId}::uuid AND customer_id = ${user.id}::uuid
      `;
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}
