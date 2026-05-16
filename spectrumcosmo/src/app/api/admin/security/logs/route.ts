import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

  try {
    const sql = getDb();
    const logs = await sql`
      SELECT 
        l.*
      FROM security_logs l
      ORDER BY l.created_at DESC
      LIMIT ${limit}
    `;
    
    return NextResponse.json(logs);
  } catch (err) {
    console.error('Failed to fetch security logs:', err);
    return NextResponse.json([]);
  }
}
