// app/api/admin/security/top-endpoints/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryMany } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get total count of high/critical events
    const totalRow = await queryOne<{ total: number | string }>`
      SELECT COUNT(*) as total FROM security_logs
      WHERE risk_level IN ('high', 'critical')
        AND created_at >= NOW() - INTERVAL '24 hours'
    `;
    const totalCount = Number(totalRow?.total ?? 1);

    // Get top endpoints with percentage
    const endpoints = await queryMany<{
      endpoint: string;
      attack_count: number | string;
      percentage: number | string;
    }>`
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

    // Ensure numbers are properly typed
    const sanitized = endpoints.map(e => ({
      endpoint: e.endpoint,
      attack_count: Number(e.attack_count),
      percentage: Number(e.percentage),
    }));

    return NextResponse.json(sanitized);
  } catch (err) {
    console.error('Failed to fetch top endpoints:', err);
    return NextResponse.json([], { status: 500 });
  }
}
