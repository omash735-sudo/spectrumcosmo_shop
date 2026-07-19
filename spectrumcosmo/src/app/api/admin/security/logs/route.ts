import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { getVerifiedAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedAdmin(req);
  
  if (error || !user || !user.is_admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // No join - just get data from security_logs
    const query = `
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
