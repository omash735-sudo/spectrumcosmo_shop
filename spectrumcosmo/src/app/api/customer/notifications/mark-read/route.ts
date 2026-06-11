import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/auth';
import { queryMany } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { notificationId } = await req.json();
  
  if (!notificationId) {
    return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
  }
  
  await queryMany`
    UPDATE notification_recipients
    SET is_read = TRUE, read_at = NOW()
    WHERE admin_notification_id = ${notificationId} 
      AND customer_id = ${user.id}
  `;
  
  return NextResponse.json({ success: true });
}
