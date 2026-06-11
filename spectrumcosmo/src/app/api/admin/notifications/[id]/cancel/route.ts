import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { updateNotification } from '@/lib/notifications-admin';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  const { id } = await params;
  await updateNotification(id, { status: 'cancelled' });
  return NextResponse.json({ success: true });
}
