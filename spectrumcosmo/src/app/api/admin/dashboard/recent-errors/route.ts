import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    const sql = getDb();
    const errors = await sql`
      SELECT * FROM error_logs 
      WHERE occurred_at >= NOW() - INTERVAL '24 hours'
      ORDER BY occurred_at DESC 
      LIMIT ${limit}
    `;
    return NextResponse.json(errors);
  } catch (err) {
    console.error('Failed to fetch errors:', err);
    return NextResponse.json([]);
  }
}
