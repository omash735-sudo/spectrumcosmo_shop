import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getNotificationsByStatus, createNotification, updateNotification, deleteNotification } from '@/lib/notifications-admin';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;
  const drafts = await getNotificationsByStatus('draft');
  return NextResponse.json({ drafts });
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;
  const { title, body: messageBody, icon_name, audience_type, specific_customer_ids } = await req.json();
  if (!title || !messageBody) {
    return NextResponse.json({ error: 'Title and message required' }, { status: 400 });
  }
  const notificationId = await createNotification({
    title,
    body: messageBody,
    icon_name: icon_name || 'bell',
    audience_type,
    specific_customer_ids: audience_type === 'specific' ? specific_customer_ids : undefined,
    status: 'draft',
    sent_by: 'spectrumcosmo team',
  });
  return NextResponse.json({ success: true, notificationId });
}

export async function PUT(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;
  const { id, title, body: messageBody, icon_name, audience_type, specific_customer_ids } = await req.json();
  if (!id) return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
  await updateNotification(id, { 
    title, 
    body: messageBody, 
    icon_name: icon_name || 'bell',
    audience_type, 
    specific_customer_ids 
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
  await deleteNotification(id);
  return NextResponse.json({ success: true });
}
