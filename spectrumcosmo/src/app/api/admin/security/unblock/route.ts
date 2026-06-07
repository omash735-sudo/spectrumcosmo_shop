// app/api/admin/security/unblock-ip/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { ipAddress } = await req.json();
    if (!ipAddress) {
      return NextResponse.json({ error: 'IP address required' }, { status: 400 });
    }

    await queryMany`
      DELETE FROM blocked_ips
      WHERE ip_address = ${ipAddress}
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to unblock IP:', err);
    return NextResponse.json({ error: 'Failed to unblock IP' }, { status: 500 });
  }
}
