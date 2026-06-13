import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { queryMany } from '@/lib/db';

export async function POST(req: NextRequest) {
  const admin = getAdminFromRequest(req);
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { notificationId } = await req.json();
  if (!notificationId) {
    return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
  }

  // Remove 'admin_' prefix if your frontend sends it (optional)
  const cleanId = notificationId.replace(/^admin_/, '');

  await queryMany`
    UPDATE notification_recipients
    SET is_read = TRUE, read_at = NOW()
    WHERE notification_id = ${cleanId}::uuid AND customer_id = ${admin.id}::uuid
  `;

  return NextResponse.json({ success: true });
}
