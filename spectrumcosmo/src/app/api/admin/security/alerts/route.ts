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
    const alerts = await sql`
      SELECT * FROM security_alerts
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return NextResponse.json(alerts);
  } catch (err) {
    console.error('Failed to fetch alerts:', err);
    return NextResponse.json([]);
  }
}
