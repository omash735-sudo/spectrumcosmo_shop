import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { endpoint, method, ip, userAgent, status, responseTimeMs } = await req.json();
    const sql = getDb();
    
    await sql`
      INSERT INTO api_logs (endpoint, method, ip_address, user_agent, status, response_time_ms, started_at)
      VALUES (${endpoint}, ${method}, ${ip}, ${userAgent}, ${status}, ${responseTimeMs}, NOW())
    `;
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to log API request:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
