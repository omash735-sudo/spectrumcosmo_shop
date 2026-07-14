import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { page_url } = body;
    
    const payload = getUserFromRequest(req);
    const userId = payload?.id || null;
    
    const sessionId = req.cookies.get('session_id')?.value || 'anonymous';
    const userAgent = req.headers.get('user-agent') || '';
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';
    
    const sql = getDb();
    
    await sql`
      INSERT INTO user_sessions (session_id, user_id, page_url, user_agent, ip_address, visited_at)
      VALUES (${sessionId}, ${userId}, ${page_url}, ${userAgent}, ${ipAddress}, NOW())
    `;
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Track visit error:', err);
    return NextResponse.json({ error: 'Failed to track visit' }, { status: 500 });
  }
}
