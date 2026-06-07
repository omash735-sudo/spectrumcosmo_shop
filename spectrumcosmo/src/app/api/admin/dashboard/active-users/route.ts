// app/api/admin/active-users/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(req: Request) {
  // Admin authentication
  const admin = getAdminFromRequest(req as any);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();

    const result = await sql`
      SELECT 
        us.session_id,
        us.user_id,
        u.name as user_name,
        u.email as user_email,
        us.page_url,
        us.user_agent,
        us.ip_address,
        us.visited_at as last_seen,
        EXTRACT(EPOCH FROM (NOW() - us.visited_at)) as seconds_ago,
        CASE 
          WHEN us.user_agent ILIKE '%Mobile%' THEN 'Mobile'
          WHEN us.user_agent ILIKE '%Tablet%' THEN 'Tablet'
          ELSE 'Desktop'
        END as device_type,
        CASE 
          WHEN us.user_agent ILIKE '%Chrome%' THEN 'Chrome'
          WHEN us.user_agent ILIKE '%Firefox%' THEN 'Firefox'
          WHEN us.user_agent ILIKE '%Safari%' THEN 'Safari'
          WHEN us.user_agent ILIKE '%Edge%' THEN 'Edge'
          ELSE 'Other'
        END as browser
      FROM user_sessions us
      LEFT JOIN users u ON us.user_id = u.id
      WHERE us.visited_at >= NOW() - INTERVAL '15 minutes'
      ORDER BY us.visited_at DESC
    `;

    // Cast to array to satisfy TypeScript (Neon returns a union that lacks .length)
    const activeUsers = result as any[];
    const count = activeUsers.length;

    return NextResponse.json({ count, users: activeUsers });
  } catch (err) {
    console.error('Failed to fetch active users:', err);
    return NextResponse.json(
      { error: 'Failed to fetch active users', count: 0, users: [] },
      { status: 500 }
    );
  }
}
