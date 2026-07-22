import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  const admin = getAdminFromRequest(req as any);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();
    const url = new URL(req.url);
    const timeRange = url.searchParams.get('timeRange') || '15'; // minutes

    const cutoffMinutes = parseInt(timeRange);
    const cutoffTime = new Date(Date.now() - cutoffMinutes * 60 * 1000);

    
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
      WHERE au.last_seen >= ${cutoffTime}
        AND (u.id IS NULL OR u.is_admin = false)   -- exclude admins, include guests
      ORDER BY au.last_seen DESC
    `;

    // Count unique sessions
    const countResult = await sql`
      SELECT COUNT(DISTINCT au.session_id) as count
      FROM active_users au
      LEFT JOIN users u ON au.user_id = u.id
      WHERE au.last_seen >= ${cutoffTime}
        AND (u.id IS NULL OR u.is_admin = false)
    `;

    const total = countResult[0]?.count || 0;

    // Format device_type to match dashboard expectations (Mobile, Tablet, Desktop)
    const formattedUsers = (users as any[]).map((user: any) => ({
      ...user,
      device_type: user.device_type === 'mobile' ? 'Mobile' : 
                    user.device_type === 'tablet' ? 'Tablet' : 'Desktop',
    }));

    return NextResponse.json({
      count: total,
      users: formattedUsers,
      cutoff: cutoffTime,
    });
  } catch (err) {
    console.error('Failed to fetch active users:', err);
    return NextResponse.json(
      { error: 'Failed to fetch active users', count: 0, users: [] },
      { status: 500 }
    );
  }
}
