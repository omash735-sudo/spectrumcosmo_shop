import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const sql = getDb();
    
    // Get active sessions from last 15 minutes (real-time)
    const activeUsers = await sql`
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
    
    const count = activeUsers.length;
    
    return NextResponse.json({ count, users: activeUsers });
  } catch (err) {
    console.error('Failed to fetch active users:', err);
    return NextResponse.json({ count: 0, users: [] });
  }
}
