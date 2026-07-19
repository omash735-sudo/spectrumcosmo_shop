import { NextRequest, NextResponse } from 'next/server';
import { queryMany } from '@/lib/db';
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
  const exportLogs = searchParams.get('export') === 'true';

  try {
    // Build search condition
    let searchCondition = '';
    if (search) {
      searchCondition = `(l.ip_address ILIKE '%${search}%' OR l.action_type ILIKE '%${search}%' OR l.endpoint ILIKE '%${search}%')`;
    }

    // Build risk condition
    let riskCondition = '';
    if (risk !== 'all') {
      riskCondition = `l.risk_level = '${risk}'`;
    }

    // Build blocked condition
    let blockedCondition = '';
    if (blocked !== 'all') {
      blockedCondition = `l.blocked = ${blocked === 'true'}`;
    }

    // Combine conditions
    let whereParts = [];
    if (searchCondition) whereParts.push(searchCondition);
    if (riskCondition) whereParts.push(riskCondition);
    if (blockedCondition) whereParts.push(blockedCondition);

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    // For export - no pagination
    if (exportLogs) {
      const exportQuery = `
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
        ${whereClause}
        ORDER BY l.created_at DESC
      `;
      const allLogs = await queryMany`${exportQuery}`;
      return NextResponse.json(allLogs);
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) as count
      FROM security_logs l
      ${whereClause}
    `;
    const countResult = await queryMany`${countQuery}`;
    const totalItems = Number(countResult?.[0]?.count ?? 0);
    const totalPages = Math.ceil(totalItems / limit);

    // Main query with pagination
    const mainQuery = `
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
      ${whereClause}
      ORDER BY l.created_at DESC
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
