import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne } from '@/lib/db';
import { getVerifiedAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedAdmin(req);
  
  if (error || !user || !user.is_admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
  const offset = (page - 1) * limit;
  const search = searchParams.get('search') || '';
  const risk = searchParams.get('risk') || 'all';
  const blocked = searchParams.get('blocked') || 'all';

  try {
    // Get all logs first (no filters for now, to test)
    let query = `
      SELECT 
        l.id,
        l.action_type,
        l.endpoint,
        l.ip_address,
        l.risk_level,
        l.blocked,
        l.user_id,
        u.email as admin_email,
        u.name as admin_name,
        l.user_agent,
        l.created_at
      FROM security_logs l
      LEFT JOIN users u ON l.user_id::text = u.id::text
      ORDER BY l.created_at DESC
      LIMIT 50
    `;

    const logs = await queryMany`${query}`;

    return NextResponse.json({
      items: logs || [],
      total: logs?.length || 0,
      totalPages: 1,
      currentPage: 1,
      limit: 50,
    });
  } catch (err) {
    console.error('Failed to fetch security logs:', err);
    return NextResponse.json(
      { 
        error: 'Failed to fetch logs', 
        details: err instanceof Error ? err.message : 'Unknown error',
        items: [], 
        total: 0, 
        totalPages: 0, 
        currentPage: 1, 
        limit: 50 
      },
      { status: 500 }
    );
  }
}
