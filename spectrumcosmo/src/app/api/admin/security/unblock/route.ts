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

    // Delete the blocked IP entry
    await queryMany`
      DELETE FROM blocked_ips
      WHERE ip_address = ${ipAddress}
    `;

    // Log the unblock action
    await queryMany`
      INSERT INTO security_logs (action_type, endpoint, ip_address, risk_level, blocked, user_id)
      VALUES ('unblock_ip', '/api/admin/security/unblock', ${ipAddress}, 'low', false, ${user.id})
    `;

    return NextResponse.json({ success: true, message: 'IP unblocked successfully' });
  } catch (err) {
    console.error('Failed to unblock IP:', err);
    return NextResponse.json({ error: 'Failed to unblock IP' }, { status: 500 });
  }
}
