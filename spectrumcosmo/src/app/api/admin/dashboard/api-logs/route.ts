import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    const sql = getDb();
    const logs = await sql`
      SELECT * FROM api_logs 
      ORDER BY started_at DESC 
      LIMIT ${limit}
    `;
    return NextResponse.json(logs);
  } catch (err) {
    console.error('Failed to fetch API logs:', err);
    return NextResponse.json([]);
  }
}
