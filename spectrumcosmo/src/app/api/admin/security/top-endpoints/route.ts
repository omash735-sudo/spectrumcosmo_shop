import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();
    const total = await sql`
      SELECT COUNT(*) as total FROM security_logs
      WHERE risk_level IN ('high', 'critical')
        AND created_at >= NOW() - INTERVAL '24 hours'
    `;
    const totalCount = total[0]?.total || 1;
    
    const endpoints = await sql`
      SELECT 
        endpoint,
        COUNT(*) as attack_count,
        ROUND(COUNT(*) * 100.0 / ${totalCount}, 2) as percentage
      FROM security_logs
      WHERE risk_level IN ('high', 'critical')
        AND created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY endpoint
      ORDER BY attack_count DESC
      LIMIT 10
    `;
    return NextResponse.json(endpoints);
  } catch (err) {
    console.error('Failed to fetch top endpoints:', err);
    return NextResponse.json([]);
  }
}
