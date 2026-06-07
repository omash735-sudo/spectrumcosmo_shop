// app/api/admin/security/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await queryOne<{
      total_requests: number | string;
      critical_count: number | string;
      high_count: number | string;
      medium_count: number | string;
      low_count: number | string;
      unique_ips: number | string;
    }>`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN risk_level = 'critical' THEN 1 END) as critical_count,
        COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_count,
        COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_count,
        COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_count,
        COUNT(DISTINCT ip_address) as unique_ips
      FROM security_logs
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `;

    const blocked = await queryOne<{ count: number | string }>`
      SELECT COUNT(*) as count FROM blocked_ips
      WHERE expires_at IS NULL OR expires_at > NOW()
    `;

    return NextResponse.json({
      total_requests: Number(summary?.total_requests ?? 0),
      critical_count: Number(summary?.critical_count ?? 0),
      high_count: Number(summary?.high_count ?? 0),
      medium_count: Number(summary?.medium_count ?? 0),
      low_count: Number(summary?.low_count ?? 0),
      unique_ips: Number(summary?.unique_ips ?? 0),
      blocked_ips: Number(blocked?.count ?? 0),
    });
  } catch (err) {
    console.error('Failed to fetch summary:', err);
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
  }
}
