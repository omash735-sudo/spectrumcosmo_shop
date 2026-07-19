import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  
  // FIXED: Check is_admin instead of role
  if (error || !user || !user.is_admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { ipAddress, reason, expiresAt } = await req.json();

    if (!ipAddress) {
      return NextResponse.json({ error: 'IP address required' }, { status: 400 });
    }

    const existing = await queryMany`
      SELECT id FROM blocked_ips
      WHERE ip_address = ${ipAddress}
        AND (expires_at IS NULL OR expires_at > NOW())
    `;

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'IP is already blocked' }, { status: 400 });
    }

    await queryMany`
      INSERT INTO blocked_ips (ip_address, reason, expires_at, blocked_by, is_manual)
      VALUES (${ipAddress}, ${reason || 'Manually blocked'}, ${expiresAt || null}, ${user.email}, true)
    `;

    await queryMany`
      INSERT INTO security_logs (action_type, endpoint, ip_address, risk_level, blocked, user_id)
      VALUES ('block_ip', '/api/admin/security/block', ${ipAddress}, 'high', true, ${user.id})
    `;

    return NextResponse.json({ success: true, message: 'IP blocked successfully' });
  } catch (err) {
    console.error('Failed to block IP:', err);
    return NextResponse.json({ error: 'Failed to block IP' }, { status: 500 });
  }
}
