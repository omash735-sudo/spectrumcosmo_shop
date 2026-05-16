import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { alertId } = await req.json();
    const sql = getDb();
    await sql`
      UPDATE security_alerts
      SET resolved = TRUE, resolved_at = NOW()
      WHERE id = ${alertId}
    `;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to resolve alert:', err);
    return NextResponse.json({ error: 'Failed to resolve alert' }, { status: 500 });
  }
}
