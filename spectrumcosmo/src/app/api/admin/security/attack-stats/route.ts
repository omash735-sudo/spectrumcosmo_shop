// app/api/admin/security/attack-stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

interface AttackStat {
  attack_type: string;
  count: number;
}

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stats = await queryMany<AttackStat>`
      SELECT 
        COALESCE(details->>'attack_type', 'other') as attack_type,
        COUNT(*) as count
      FROM security_logs
      WHERE risk_level IN ('high', 'critical')
        AND created_at >= NOW() - INTERVAL '24 hours'
        AND details IS NOT NULL
      GROUP BY attack_type
      ORDER BY count DESC
    `;
    return NextResponse.json(stats);
  } catch (err) {
    console.error('Failed to fetch attack stats:', err);
    return NextResponse.json({ error: 'Failed to fetch attack stats' }, { status: 500 });
  }
}
