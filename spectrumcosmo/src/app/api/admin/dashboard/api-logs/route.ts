import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const revalidate = 30;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '15'), 30);
  const start = performance.now();

  try {
    const sql = getDb();
    const logs = await sql`
      SELECT id, endpoint, method, status, response_time_ms, started_at, ip_address
      FROM api_logs 
      ORDER BY started_at DESC 
      LIMIT ${limit}
    `;
    
    const end = performance.now();
    console.log(`API Logs took ${(end - start).toFixed(0)}ms`);
    
    return NextResponse.json(logs, {
      headers: {
        'Cache-Control': 's-maxage=30, stale-while-revalidate=15',
      },
    });
  } catch (err) {
    console.error('Failed to fetch API logs:', err);
    return NextResponse.json([]);
  }
}
