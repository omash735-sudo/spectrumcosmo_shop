import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const ip = searchParams.get('ip');
    
    if (!ip) {
      return NextResponse.json({ error: 'IP required' }, { status: 400 });
    }
    
    const sql = getDb();
    const activity = await sql`
      SELECT * FROM security_logs
      WHERE ip_address = ${ip}
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return NextResponse.json(activity);
  } catch (err) {
    console.error('Failed to fetch IP activity:', err);
    return NextResponse.json([]);
  }
}
