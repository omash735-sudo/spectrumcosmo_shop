export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  // 1. User notifications (order updates, delivery confirmations, etc.)
  const userNotifications = await getUserNotifications(user.id, limit, offset);
  const userUnreadCount = await getUnreadNotificationCount(user.id);

  // 2. Admin notifications – relaxed conditions (no sent_at IS NOT NULL)
  const adminNotifications = await queryMany`
    SELECT 
      n.id,
      n.title,
      n.body as message,
      'admin' as type,
      COALESCE(n.sent_at, n.created_at) as created_at,
      COALESCE(r.is_read, FALSE) as is_read,
      '/account/notifications' as action_url,
      'View Details' as action_label
    FROM admin_notifications n
    LEFT JOIN notification_recipients r ON r.notification_id = n.id AND r.customer_id = ${user.id}::uuid
    WHERE n.status = 'sent'
      AND (r.customer_id IS NOT NULL OR n.audience_type = 'all')
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

  // 4. Format
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

  // 5. Merge & paginate
  const allNotifications = [...formattedUser, ...formattedAdmin];
  allNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const paginated = allNotifications.slice(offset, offset + limit);
  const totalUnread = userUnreadCount + adminUnreadCount;

  return NextResponse.json({
    notifications: paginated,
    unreadCount: totalUnread,
    hasMore: paginated.length === limit,
  });
}
