import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getNotificationsByStatus } from '@/lib/notifications-admin';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get('status') as any) || 'all';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  const notifications = await getNotificationsByStatus(status, limit, offset);
  return NextResponse.json({ notifications });
}
