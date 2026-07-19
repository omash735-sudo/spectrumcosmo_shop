import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  
  // Check is_admin instead of role
  if (error || !user || !user.is_admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '0');

  try {
    // Build query as a template literal
    let query = `
      SELECT 
        id,
        ip_address,
        reason,
        expires_at,
        blocked_by,
        is_manual,
        created_at
      FROM blocked_ips
      WHERE expires_at IS NULL OR expires_at > NOW()
      ORDER BY created_at DESC
    `;
    
    if (limit > 0) {
      query += ` LIMIT ${limit}`;
    }

    // FIX: Use template literal with sql tag
    const blockedIPs = await queryMany`${query}`;
    return NextResponse.json(blockedIPs);
  } catch (err) {
    console.error('Failed to fetch blocked IPs:', err);
    return NextResponse.json({ error: 'Failed to fetch blocked IPs' }, { status: 500 });
  }
}
