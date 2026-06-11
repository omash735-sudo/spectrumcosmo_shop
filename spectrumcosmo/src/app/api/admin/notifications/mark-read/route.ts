// app/api/admin/notifications/mark-read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryMany } from '@/lib/db';

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;
  
  const { notificationId } = await req.json();
  const adminId = (req as any).adminId;
  
  if (!notificationId) {
    return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
  }
  
  await queryMany`
    UPDATE notification_recipients
    SET is_read = TRUE, read_at = NOW()
    WHERE notification_id = ${notificationId}::uuid AND customer_id = ${adminId}::uuid
  `;
  
  return NextResponse.json({ success: true });
}
