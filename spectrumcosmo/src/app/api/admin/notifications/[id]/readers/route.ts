import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getRecipientsByNotification } from '@/lib/notifications-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  
  const { id } = await params;
  const { read, unread } = await getRecipientsByNotification(id);
  
  return NextResponse.json({ read, unread });
}
