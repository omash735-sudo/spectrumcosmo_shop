// app/api/track-visit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  let deviceType = 'desktop';
  let browser = 'unknown';
  let os = 'unknown';

  if (/(tablet|ipad|playbook)|(android(?!.*mobile))/i.test(ua)) deviceType = 'tablet';
  else if (/(mobile|iphone|ipod|android|blackberry|windows phone)/i.test(ua)) deviceType = 'mobile';

  if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  else if (ua.includes('opera')) browser = 'Opera';

  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  return { deviceType, browser, os };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { page_url, referrer } = body;

    const payload = getUserFromRequest(req);
    const userId = payload?.id || null;

    let isAdmin = false;
    if (userId) {
      const sql = getDb();
      const userResult = await sql`SELECT is_admin FROM users WHERE id = ${userId}`;
      isAdmin = userResult[0]?.is_admin || false;
    }

    if (isAdmin) {
      return NextResponse.json({ success: true, skipped: true });
    }

    const sessionId = req.cookies.get('session_id')?.value || 
                     req.cookies.get('visitor_session')?.value || 
                     crypto.randomUUID();

    const userAgent = req.headers.get('user-agent') || '';
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 'unknown';
    const referrerHeader = req.headers.get('referer') || referrer || 'direct';

    const { deviceType, browser, os } = parseUserAgent(userAgent);

    const sql = getDb();

    // Insert into visitor_tracking (historical data)
    await sql`
      INSERT INTO visitor_tracking (
        session_id, 
        user_id, 
        user_name,
        user_email,
        ip_address, 
        user_agent, 
        device_type, 
        browser, 
        os,
        page_url,
        referrer,
        visited_at,
        last_activity_at,
        visit_count
      )
      VALUES (
        ${sessionId}, 
        ${userId}, 
        ${payload?.name || null},
        ${payload?.email || null},
        ${ipAddress}, 
        ${userAgent}, 
        ${deviceType}, 
        ${browser}, 
        ${os},
        ${page_url},
        ${referrerHeader},
        NOW(),
        NOW(),
        1
      )
      ON CONFLICT (id) DO NOTHING
    `;

    // Also track in active_users for real-time
    await sql`
      INSERT INTO active_users (
        session_id, 
        user_id, 
        current_page, 
        user_agent, 
        ip_address, 
        device_type, 
        browser, 
        os, 
        last_seen
      )
      VALUES (
        ${sessionId}, 
        ${userId}, 
        ${page_url}, 
        ${userAgent}, 
        ${ipAddress}, 
        ${deviceType}, 
        ${browser}, 
        ${os}, 
        NOW()
      )
      ON CONFLICT (session_id) 
      DO UPDATE SET
        user_id = EXCLUDED.user_id,
        current_page = EXCLUDED.current_page,
        user_agent = EXCLUDED.user_agent,
        ip_address = EXCLUDED.ip_address,
        device_type = EXCLUDED.device_type,
        browser = EXCLUDED.browser,
        os = EXCLUDED.os,
        last_seen = NOW()
    `;

    // Insert into analytics_events for dashboard stats
    await sql`
      INSERT INTO analytics_events (
        event_type,
        session_id,
        user_id,
        page_url,
        referrer,
        user_agent,
        ip_address,
        metadata,
        created_at
      )
      VALUES (
        'page_view',
        ${sessionId},
        ${userId},
        ${page_url},
        ${referrerHeader},
        ${userAgent},
        ${ipAddress},
        ${JSON.stringify({ deviceType, browser, os })}::jsonb,
        NOW()
      )
    `;

    // Clean up active_users older than 24 hours
    await sql`DELETE FROM active_users WHERE last_seen < NOW() - INTERVAL '24 hours'`;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Track visit error:', err);
    return NextResponse.json({ error: 'Failed to track visit' }, { status: 500 });
  }
}
