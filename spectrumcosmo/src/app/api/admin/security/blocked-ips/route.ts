import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { getVerifiedAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedAdmin(req);

  if (error || !user || !user.is_admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '0');

  try {
    let blockedIPs;

    if (limit > 0) {
      blockedIPs = await queryMany`
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
        LIMIT ${limit}
      `;
    } else {
      blockedIPs = await queryMany`
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
    }

    return NextResponse.json(blockedIPs);
  } catch (err) {
    // Log the FULL error
    console.error('Database error details:', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      code: (err as any)?.code,
      detail: (err as any)?.detail
    });
    return NextResponse.json({ 
      error: 'Failed to fetch blocked IPs',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
