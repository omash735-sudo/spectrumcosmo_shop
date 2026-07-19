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
  const exportLogs = searchParams.get('export') === 'true';

  try {
    // Count query
    let countQuery = `SELECT COUNT(*) as count FROM security_logs WHERE 1=1`;
    
    if (search) {
      countQuery += ` AND (ip_address ILIKE '%${search}%' OR action_type ILIKE '%${search}%' OR endpoint ILIKE '%${search}%')`;
    }
    if (risk !== 'all') {
      countQuery += ` AND risk_level = '${risk}'`;
    }
    if (blocked !== 'all') {
      countQuery += ` AND blocked = ${blocked === 'true'}`;
    }

    const countResult = await queryOne`${countQuery}`;
    const totalItems = Number(countResult?.count ?? 0);
    const totalPages = Math.ceil(totalItems / limit);

    // Main query with join
    let mainQuery = `
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
      WHERE 1=1
    `;
    
    if (search) {
      mainQuery += ` AND (l.ip_address ILIKE '%${search}%' OR l.action_type ILIKE '%${search}%' OR l.endpoint ILIKE '%${search}%')`;
    }
    if (risk !== 'all') {
      mainQuery += ` AND l.risk_level = '${risk}'`;
    }
    if (blocked !== 'all') {
      mainQuery += ` AND l.blocked = ${blocked === 'true'}`;
    }
    
    mainQuery += ` ORDER BY l.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

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
