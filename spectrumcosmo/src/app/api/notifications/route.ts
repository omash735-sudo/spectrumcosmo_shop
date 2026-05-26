import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/auth';
import { getUserNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(user.id, limit, offset),
    getUnreadNotificationCount(user.id),
  ]);

  return NextResponse.json({
    notifications,
    unreadCount,
    hasMore: notifications.length === limit,
  });
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  const { notificationId, markAll } = await req.json();

  if (markAll) {
    await markAllNotificationsAsRead(user.id);
    return NextResponse.json({ success: true, markAll: true });
  }

  if (notificationId) {
    await markNotificationAsRead(notificationId, user.id);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}
