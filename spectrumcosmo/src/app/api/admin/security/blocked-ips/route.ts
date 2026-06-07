// app/api/admin/security/blocked-ips/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const blockedIPs = await queryMany`
      SELECT * FROM blocked_ips
      WHERE expires_at IS NULL OR expires_at > NOW()
      ORDER BY created_at DESC
    `;
    return NextResponse.json(blockedIPs);
  } catch (err) {
    console.error('Failed to fetch blocked IPs:', err);
    return NextResponse.json({ error: 'Failed to fetch blocked IPs' }, { status: 500 });
  }
}
