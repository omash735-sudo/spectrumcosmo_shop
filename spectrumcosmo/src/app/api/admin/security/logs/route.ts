// app/api/admin/security/logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

  try {
    const logs = await queryMany`
      SELECT 
        l.*
      FROM security_logs l
      ORDER BY l.created_at DESC
      LIMIT ${limit}
    `;
    return NextResponse.json(logs);
  } catch (err) {
    console.error('Failed to fetch security logs:', err);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
