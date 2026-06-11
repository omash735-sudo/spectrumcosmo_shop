import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { deleteNotification } from '@/lib/notifications-admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  
  const { id } = await params;
  await deleteNotification(id);
  
  return NextResponse.json({ success: true });
}
