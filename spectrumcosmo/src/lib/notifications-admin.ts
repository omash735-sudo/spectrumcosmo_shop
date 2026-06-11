// lib/notifications-admin.ts
import { queryMany, queryOne } from '@/lib/db';

export type NotificationStatus = 'draft' | 'scheduled' | 'sent' | 'cancelled';
export type AudienceType = 'all' | 'specific';

export interface AdminNotification {
  id: string;
  title: string;
  body: string;
  audience_type: AudienceType;
  specific_customer_ids: string[] | null;
  status: NotificationStatus;
  sent_by: string;
  sent_at: Date | null;
  scheduled_for: Date | null;
  created_at: Date;
  expires_at: Date;
  is_deleted: boolean;
}

export interface NotificationWithStats extends AdminNotification {
  total_recipients: number;
  read_count: number;
  unread_count: number;
}

export async function createNotification(data: {
  title: string;
  body: string;
  audience_type: AudienceType;
  specific_customer_ids?: string[];
  status: NotificationStatus;
  scheduled_for?: Date;
  sent_by?: string;
}): Promise<string> {
  const id = crypto.randomUUID();
  
  await queryMany`
    INSERT INTO admin_notifications (
      id, title, body, audience_type, specific_customer_ids,
      status, scheduled_for, sent_by
    ) VALUES (
      ${id}, ${data.title}, ${data.body}, ${data.audience_type},
      ${data.specific_customer_ids ? JSON.stringify(data.specific_customer_ids) : null},
      ${data.status}, ${data.scheduled_for || null}, ${data.sent_by || 'spectrumcosmo team'}
    )
  `;
  
  return id;
}

export async function updateNotification(id: string, data: Partial<{
  title: string;
  body: string;
  audience_type: AudienceType;
  specific_customer_ids: string[];
  status: NotificationStatus;
  scheduled_for: Date;
}>) {
  const sql = require('@neondatabase/serverless').neon(process.env.POSTGRES_URL!);
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (data.title !== undefined) {
    updates.push(`title = $${paramIndex++}`);
    values.push(data.title);
  }
  if (data.body !== undefined) {
    updates.push(`body = $${paramIndex++}`);
    values.push(data.body);
  }
  if (data.audience_type !== undefined) {
    updates.push(`audience_type = $${paramIndex++}`);
    values.push(data.audience_type);
  }
  if (data.specific_customer_ids !== undefined) {
    updates.push(`specific_customer_ids = $${paramIndex++}`);
    values.push(JSON.stringify(data.specific_customer_ids));
  }
  if (data.status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    values.push(data.status);
  }
  if (data.scheduled_for !== undefined) {
    updates.push(`scheduled_for = $${paramIndex++}`);
    values.push(data.scheduled_for);
  }
  
  if (updates.length === 0) return;
  
  values.push(id);
  await sql(`UPDATE admin_notifications SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);
}

export async function deleteNotification(id: string) {
  await queryMany`
    UPDATE admin_notifications 
    SET is_deleted = TRUE 
    WHERE id = ${id}
  `;
}

export async function getNotificationsByStatus(
  status: NotificationStatus | 'all',
  limit: number = 50,
  offset: number = 0
): Promise<NotificationWithStats[]> {
  const sql = require('@neondatabase/serverless').neon(process.env.POSTGRES_URL!);
  
  let query = `
    SELECT 
      n.*,
      COUNT(r.id) as total_recipients,
      COUNT(CASE WHEN r.is_read = TRUE THEN 1 END) as read_count
    FROM admin_notifications n
    LEFT JOIN notification_recipients r ON r.notification_id = n.id
    WHERE n.is_deleted = FALSE
  `;
  
  if (status !== 'all') {
    query += ` AND n.status = '${status}'`;
  }
  
  query += `
    GROUP BY n.id
    ORDER BY 
      CASE 
        WHEN n.status = 'scheduled' THEN n.scheduled_for
        ELSE n.created_at
      END DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  
  const results = await sql(query);
  return results.map((row: any) => ({
    ...row,
    specific_customer_ids: row.specific_customer_ids ? JSON.parse(row.specific_customer_ids) : null,
    total_recipients: Number(row.total_recipients) || 0,
    read_count: Number(row.read_count) || 0,
    unread_count: (Number(row.total_recipients) || 0) - (Number(row.read_count) || 0),
  }));
}

export async function getNotificationById(id: string): Promise<AdminNotification | null> {
  const results = await queryMany`
    SELECT * FROM admin_notifications 
    WHERE id = ${id} AND is_deleted = FALSE
  `;
  
  if (results.length === 0) return null;
  
  const row = results[0];
  return {
    ...row,
    specific_customer_ids: row.specific_customer_ids ? JSON.parse(row.specific_customer_ids) : null,
  };
}

export async function getAllCustomerIds(): Promise<string[]> {
  const results = await queryMany`
    SELECT id FROM users WHERE deleted_at IS NULL
  `;
  return results.map((r: any) => r.id);
}

export async function getRecipientsByNotification(
  notificationId: string
): Promise<{ read: any[]; unread: any[] }> {
  const recipients = await queryMany`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.phone,
      r.is_read,
      r.read_at,
      r.delivered_at
    FROM notification_recipients r
    JOIN users u ON u.id = r.customer_id
    WHERE r.notification_id = ${notificationId}::uuid
    ORDER BY r.is_read ASC, r.read_at DESC
  `;
  
  return {
    read: recipients.filter((r: any) => r.is_read),
    unread: recipients.filter((r: any) => !r.is_read),
  };
}

export async function getUnreadCustomerIds(notificationId: string): Promise<string[]> {
  const results = await queryMany`
    SELECT customer_id FROM notification_recipients
    WHERE notification_id = ${notificationId}::uuid AND is_read = FALSE
  `;
  return results.map((r: any) => r.customer_id);
}

export async function markNotificationAsRead(notificationId: string, customerId: string): Promise<void> {
  await queryMany`
    UPDATE notification_recipients
    SET is_read = TRUE, read_at = NOW()
    WHERE notification_id = ${notificationId}::uuid AND customer_id = ${customerId}::uuid
  `;
}
