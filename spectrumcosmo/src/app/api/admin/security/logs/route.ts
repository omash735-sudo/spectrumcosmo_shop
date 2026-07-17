import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
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
    let whereConditions = ['1=1'];
    const params: any[] = [];

    if (search) {
      whereConditions.push(`(l.ip_address ILIKE $${params.length + 1} OR l.action_type ILIKE $${params.length + 1} OR l.endpoint ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (risk !== 'all') {
      whereConditions.push(`l.risk_level = $${params.length + 1}`);
      params.push(risk);
    }

    if (blocked !== 'all') {
      whereConditions.push(`l.blocked = $${params.length + 1}`);
      params.push(blocked === 'true');
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count for pagination
    const countResult = await queryOne<{ count: number | string }>`
      SELECT COUNT(*) as count
      FROM security_logs l
      WHERE ${whereClause}
    `;

    const totalItems = Number(countResult?.count ?? 0);
    const totalPages = Math.ceil(totalItems / limit);

    // If exporting, get all data without pagination
    if (exportLogs) {
      const allLogs = await queryMany`
        SELECT 
          l.id,
          l.action_type,
          l.endpoint,
          l.ip_address,
          l.risk_level,
          l.blocked,
          l.user_id,
          l.user_agent,
          l.created_at
        FROM security_logs l
        WHERE ${whereClause}
        ORDER BY l.created_at DESC
      `;
      return NextResponse.json(allLogs);
    }

    // Get paginated logs
    const logs = await queryMany`
      SELECT 
        l.id,
        l.action_type,
        l.endpoint,
        l.ip_address,
        l.risk_level,
        l.blocked,
        l.user_id,
        l.user_agent,
        l.created_at
      FROM security_logs l
      WHERE ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return NextResponse.json({
      items: logs,
      total: totalItems,
      totalPages: totalPages,
      currentPage: page,
      limit: limit,
    });
  } catch (err) {
    console.error('Failed to fetch security logs:', err);
    return NextResponse.json(
      { error: 'Failed to fetch logs', items: [], total: 0, totalPages: 0, currentPage: 1, limit: 50 },
      { status: 500 }
    );
  }
}
