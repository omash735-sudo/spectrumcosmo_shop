// app/api/admin/notifications/unread-count/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryMany } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;
  
  const adminId = (req as any).adminId;
  
  const result = await queryMany`
    SELECT COUNT(*) as count
    FROM notification_recipients r
    JOIN admin_notifications n ON n.id = r.notification_id
    WHERE r.customer_id = ${adminId}::uuid
      AND r.is_read = FALSE
      AND n.status = 'sent'
  `;
  
  const count = Number(result[0]?.count) || 0;
  
  return NextResponse.json({ count });
}
