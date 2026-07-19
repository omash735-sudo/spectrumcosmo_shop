import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { getVerifiedAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedAdmin(req);
  
  if (error || !user || !user.is_admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // SIMPLEST POSSIBLE QUERY - no filters, no joins, no pagination
    const logs = await queryMany`
      SELECT 
        id,
        action_type,
        endpoint,
        ip_address,
        risk_level,
        blocked,
        user_id,
        user_agent,
        created_at
      FROM security_logs
      ORDER BY created_at DESC
      LIMIT 10
    `;

    console.log('✅ Logs found:', logs?.length || 0);

    return NextResponse.json({
      items: logs || [],
      total: logs?.length || 0,
      totalPages: 1,
      currentPage: 1,
      limit: 10,
    });
  } catch (err) {
    console.error('❌ Error:', err);
    return NextResponse.json(
      { 
        error: 'Failed to fetch logs', 
        details: err instanceof Error ? err.message : 'Unknown error',
        items: [], 
        total: 0, 
        totalPages: 0, 
        currentPage: 1, 
        limit: 10 
      },
      { status: 500 }
    );
  }
}
