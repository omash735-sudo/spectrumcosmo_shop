import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
import { getVerifiedAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedAdmin(req);
  
  if (error || !user || !user.is_admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const offset = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const risk = searchParams.get('risk') || 'all';
    const blocked = searchParams.get('blocked') || 'all';

    let conditions = [];
    
    if (search) {
      conditions.push(`(ip_address ILIKE '%${search}%' OR action_type ILIKE '%${search}%' OR endpoint ILIKE '%${search}%')`);
    }
    if (risk !== 'all') {
      conditions.push(`risk_level = '${risk}'`);
    }
    if (blocked !== 'all') {
      conditions.push(`blocked = ${blocked === 'true'}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) as count
      FROM security_logs
      ${whereClause}
    `;
    const countResult = await queryMany`${countQuery}`;
    const totalItems = Number(countResult?.[0]?.count ?? 0);
    const totalPages = Math.ceil(totalItems / limit);

    // Main query - NO JOIN
    const mainQuery = `
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
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const logs = await queryMany`${mainQuery}`;

    return NextResponse.json({
      items: logs || [],
      total: totalItems,
      totalPages: totalPages,
      currentPage: page,
      limit: limit,
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
