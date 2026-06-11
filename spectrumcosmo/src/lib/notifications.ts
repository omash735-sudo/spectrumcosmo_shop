// lib/notifications.ts
import { queryMany, queryOne } from '@/lib/db';

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'delivery_confirmation' | 'order_update' | 'payment_reminder' | 'promotion';
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

/**
 * Create an in-app notification for a user
 */
export async function createNotification(data: NotificationData): Promise<void> {
  await queryMany`
    INSERT INTO user_notifications (user_id, title, message, type, action_url, action_label, metadata, created_at)
    VALUES (${data.userId}::uuid, ${data.title}, ${data.message}, ${data.type}, 
            ${data.actionUrl || null}, ${data.actionLabel || null}, 
            ${data.metadata ? JSON.stringify(data.metadata) : null}, NOW())
  `;
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const result = await queryOne`
    SELECT COUNT(*) as count 
    FROM user_notifications 
    WHERE user_id = ${userId}::uuid AND is_read = false
  `;
  return Number(result?.count || 0);
}

/**
 * Get notifications for a user (paginated)
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<any[]> {
  return await queryMany`
    SELECT * FROM user_notifications 
    WHERE user_id = ${userId}::uuid
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: number, userId: string): Promise<void> {
  await queryMany`
    UPDATE user_notifications 
    SET is_read = true, read_at = NOW()
    WHERE id = ${notificationId} AND user_id = ${userId}::uuid
  `;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  await queryMany`
    UPDATE user_notifications 
    SET is_read = true, read_at = NOW()
    WHERE user_id = ${userId}::uuid AND is_read = false
  `;
}

/**
 * Send delivery confirmation request notification
 */
export async function requestDeliveryConfirmation(
  orderId: string,
  userId: string,
  customerName: string,
  orderNumber: string
): Promise<void> {
  await createNotification({
    userId,
    title: 'Did you receive your order?',
    message: `Hello ${customerName}, did you receive order #${orderNumber.slice(-8)}? Please let us know.`,
    type: 'delivery_confirmation',
    actionUrl: `/account/orders/${orderId}/confirm`,
    actionLabel: 'Confirm Delivery',
    metadata: { orderId, orderNumber },
  });
}
