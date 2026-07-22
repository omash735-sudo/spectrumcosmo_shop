// app/api/admin/active-users/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  console.log('[active-users] API route was called!'); // Debug

  try {
    const admin = getAdminFromRequest(req as any);
    console.log('[active-users] admin check:', admin); // Debug

    if (!admin) {
      console.log('[active-users] Unauthorized – returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const timeRangeParam = url.searchParams.get('timeRange') || '15';
    let cutoffMinutes = parseInt(timeRangeParam, 10);

    if (isNaN(cutoffMinutes) || cutoffMinutes < 1) {
      cutoffMinutes = 15;
    }

    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - cutoffMinutes);

    console.log('[active-users] cutoffTime:', cutoffTime.toISOString());

    const sql = getDb();

    const users = await sql`
      SELECT 
        au.session_id,
        au.user_id,
        au.current_page as page_url,
        au.user_agent,
        au.ip_address,
        au.device_type,
        au.browser,
        au.os,
        au.last_seen as visited_at,
        EXTRACT(EPOCH FROM (NOW() - au.last_seen)) as seconds_ago,
        u.name as user_name,
        u.email as user_email
      FROM active_users au
      LEFT JOIN users u ON au.user_id = u.id
      WHERE au.last_seen >= ${cutoffTime.toISOString()}::timestamptz
        AND (u.id IS NULL OR u.is_admin = false)
      ORDER BY au.last_seen DESC
    `;

    const countResult = await sql`
      SELECT COUNT(DISTINCT au.session_id) as count
      FROM active_users au
      LEFT JOIN users u ON au.user_id = u.id
      WHERE au.last_seen >= ${cutoffTime.toISOString()}::timestamptz
        AND (u.id IS NULL OR u.is_admin = false)
    `;

    const total = countResult[0]?.count || 0;

    const formattedUsers = (users as any[]).map((user: any) => ({
      ...user,
      device_type: user.device_type === 'mobile' ? 'Mobile' : 
                    user.device_type === 'tablet' ? 'Tablet' : 'Desktop',
    }));

    console.log('[active-users] returning count:', total);

    return NextResponse.json({
      count: total,
      users: formattedUsers,
      cutoff: cutoffTime.toISOString(),
    });
  } catch (err) {
    console.error('[active-users] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch active users', count: 0, users: [] },
      { status: 500 }
    );
  }
}
