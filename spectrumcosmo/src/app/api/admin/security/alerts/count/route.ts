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
    const [result] = await sql`
      SELECT COUNT(*) as count
      FROM security_logs
      WHERE severity IN ('critical', 'high')
        AND created_at > NOW() - INTERVAL '1 hour'
        AND resolved IS NOT TRUE
    `;
    
    return NextResponse.json({ count: parseInt(result.count) || 0 });
  } catch (err) {
    console.error('Failed to get alert count:', err);
    return NextResponse.json({ count: 0 });
  }
}
