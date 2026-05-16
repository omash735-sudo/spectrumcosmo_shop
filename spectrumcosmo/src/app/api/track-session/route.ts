import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, pageUrl, userAgent, ipAddress, referrer } = await request.json();
    
    const sql = getDb();
    
    // Update or insert session
    await sql`
      INSERT INTO user_sessions (session_id, user_id, page_url, user_agent, ip_address, referrer, visited_at)
      VALUES (${sessionId}, ${userId}, ${pageUrl}, ${userAgent}, ${ipAddress}, ${referrer}, CURRENT_TIMESTAMP)
      ON CONFLICT (session_id) 
      DO UPDATE SET 
        user_id = COALESCE(EXCLUDED.user_id, user_sessions.user_id),
        page_url = EXCLUDED.page_url,
        visited_at = CURRENT_TIMESTAMP,
        exited_at = NULL
    `;
    
    // Also update cart session if exists
    await sql`
      INSERT INTO cart_sessions (session_id, user_id, last_activity, status)
      VALUES (${sessionId}, ${userId}, CURRENT_TIMESTAMP, 'active')
      ON CONFLICT (session_id) 
      DO UPDATE SET 
        user_id = COALESCE(EXCLUDED.user_id, cart_sessions.user_id),
        last_activity = CURRENT_TIMESTAMP,
        status = 'active'
    `;
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Session tracking error:', err);
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 });
  }
}
