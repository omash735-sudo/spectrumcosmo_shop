import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getNotificationsByStatus } from '@/lib/notifications-admin';

export async function GET(req: NextRequest) {
  try {
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const notifications = await getNotificationsByStatus(status as any, limit, offset);
    return NextResponse.json({ notifications });
  } catch (err: any) {
    console.error('GET /api/admin/notifications error:', err);
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
