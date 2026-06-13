import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createNotification } from '@/lib/notifications-admin';

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { title, body: messageBody, icon_name, audience_type, specific_customer_ids, scheduled_for } = await req.json();
  if (!title || !messageBody || !scheduled_for) {
    return NextResponse.json({ error: 'Title, message, and scheduled time are required' }, { status: 400 });
  }

  const scheduledDate = new Date(scheduled_for);
  if (isNaN(scheduledDate.getTime())) {
    return NextResponse.json({ error: 'Invalid scheduled date' }, { status: 400 });
  }

  const notificationId = await createNotification({
    title,
    body: messageBody,
    icon_name: icon_name || 'bell',
    audience_type,
    specific_customer_ids: audience_type === 'specific' ? specific_customer_ids : undefined,
    status: 'scheduled',
    scheduled_for: scheduledDate,
    sent_by: 'spectrumcosmo team',
  });

  return NextResponse.json({ success: true, notificationId, scheduled_for: scheduledDate });
}
