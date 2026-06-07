// app/api/admin/security/alert-count/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await queryOne<{ count: string | number }>`
      SELECT COUNT(*) as count
      FROM security_logs
      WHERE severity IN ('critical', 'high')
        AND created_at > NOW() - INTERVAL '1 hour'
        AND resolved IS NOT TRUE
    `;
    const count = result ? Number(result.count) : 0;
    return NextResponse.json({ count });
  } catch (err) {
    console.error('Failed to get alert count:', err);
    return NextResponse.json({ error: 'Failed to get alert count' }, { status: 500 });
  }
}
