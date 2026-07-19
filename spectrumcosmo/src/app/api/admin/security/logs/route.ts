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
    // --------------------------------------------
    // COUNT QUERY - Hardcoded with conditions
    // --------------------------------------------
    let countResult;

    if (search && risk !== 'all' && blocked !== 'all') {
      countResult = await queryMany`
        SELECT COUNT(*) as count
        FROM security_logs l
        WHERE (l.ip_address ILIKE '%${search}%' OR l.action_type ILIKE '%${search}%' OR l.endpoint ILIKE '%${search}%')
          AND l.risk_level = '${risk}'
          AND l.blocked = ${blocked === 'true'}
      `;
    } else if (search && risk !== 'all') {
      countResult = await queryMany`
        SELECT COUNT(*) as count
        FROM security_logs l
        WHERE (l.ip_address ILIKE '%${search}%' OR l.action_type ILIKE '%${search}%' OR l.endpoint ILIKE '%${search}%')
          AND l.risk_level = '${risk}'
      `;
    } else if (search && blocked !== 'all') {
      countResult = await queryMany`
        SELECT COUNT(*) as count
        FROM security_logs l
        WHERE (l.ip_address ILIKE '%${search}%' OR l.action_type ILIKE '%${search}%' OR l.endpoint ILIKE '%${search}%')
          AND l.blocked = ${blocked === 'true'}
      `;
    } else if (risk !== 'all' && blocked !== 'all') {
      countResult = await queryMany`
        SELECT COUNT(*) as count
        FROM security_logs l
        WHERE l.risk_level = '${risk}'
          AND l.blocked = ${blocked === 'true'}
      `;
    } else if (search) {
      countResult = await queryMany`
        SELECT COUNT(*) as count
        FROM security_logs l
        WHERE l.ip_address ILIKE '%${search}%' OR l.action_type ILIKE '%${search}%' OR l.endpoint ILIKE '%${search}%'
      `;
    } else if (risk !== 'all') {
      countResult = await queryMany`
        SELECT COUNT(*) as count
        FROM security_logs l
        WHERE l.risk_level = '${risk}'
      `;
    } else if (blocked !== 'all') {
      countResult = await queryMany`
        SELECT COUNT(*) as count
        FROM security_logs l
        WHERE l.blocked = ${blocked === 'true'}
      `;
    } else {
      countResult = await queryMany`
        SELECT COUNT(*) as count
        FROM security_logs l
      `;
    }

    const totalItems = Number(countResult?.[0]?.count ?? 0);
    const totalPages = Math.ceil(totalItems / limit);

    // --------------------------------------------
    // MAIN QUERY - Hardcoded with conditions
    // --------------------------------------------
    let logs;

    if (exportLogs) {
      // Export - no pagination
      if (search && risk !== 'all' && blocked !== 'all') {
        logs = await queryMany`
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
          WHERE (l.ip_address ILIKE '%${search}%' OR l.action_type ILIKE '%${search}%' OR l.endpoint ILIKE '%${search}%')
            AND l.risk_level = '${risk}'
            AND l.blocked = ${blocked === 'true'}
          ORDER BY l.created_at DESC
        `;
      } else if (search && risk !== 'all') {
        logs = await queryMany`
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
          WHERE (l.ip_address ILIKE '%${search}%' OR l.action_type ILIKE '%${search}%' OR l.endpoint ILIKE '%${search}%')
            AND l.risk_level = '${risk}'
          ORDER BY l.created_at DESC
        `;
      } else if (search && blocked !== 'all') {
        logs = await queryMany`
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
          WHERE (l.ip_address ILIKE '%${search}%' OR l.action_type ILIKE '%${search}%' OR l.endpoint ILIKE '%${search}%')
            AND l.blocked = ${blocked === 'true'}
          ORDER BY l.created_at DESC
        `;
      } else if (risk !== 'all' && blocked !== 'all') {
        logs = await queryMany`
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
          WHERE l.risk_level = '${risk}'
            AND l.blocked = ${blocked === 'true'}
          ORDER BY l.created_at DESC
        `;
      } else if (search) {
        logs = await queryMany`
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
          WHERE l.ip_address ILIKE '%${search}%' OR l.action_type ILIKE '%${search}%' OR l.endpoint ILIKE '%${search}%'
          ORDER BY l.created_at DESC
        `;
      } else if (risk !== 'all') {
        logs = await queryMany`
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
          WHERE l.risk_level = '${risk}'
          ORDER BY l.created_at DESC
        `;
      } else if (blocked !== 'all') {
        logs = await queryMany`
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
          WHERE l.blocked = ${blocked === 'true'}
          ORDER BY l.created_at DESC
        `;
      } else {
        logs = await queryMany`
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
        `;
      }
      
      return NextResponse.json(logs);
    }

    // --------------------------------------------
    // REGULAR QUERY - With pagination
    // --------------------------------------------
    if (search && risk !== 'all' && blocked !== 'all') {
      logs = await queryMany`
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
        WHERE (l.ip_address ILIKE '%${search}%' OR l.action_type ILIKE '%${search}%' OR l.endpoint ILIKE '%${search}%')
          AND l.risk_level = '${risk}'
          AND l.blocked = ${blocked === 'true'}
        ORDER BY l.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (search && risk !== 'all') {
      logs = await queryMany`
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
        WHERE (l.ip_address ILIKE '%${search}%' OR l.action_type ILIKE '%${search}%' OR l.endpoint ILIKE '%${search}%')
          AND l.risk_level = '${risk}'
        ORDER BY l.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (search && blocked !== 'all') {
      logs = await queryMany`
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
        WHERE (l.ip_address ILIKE '%${search}%' OR l.action_type ILIKE '%${search}%' OR l.endpoint ILIKE '%${search}%')
          AND l.blocked = ${blocked === 'true'}
        ORDER BY l.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (risk !== 'all' && blocked !== 'all') {
      logs = await queryMany`
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
        WHERE l.risk_level = '${risk}'
          AND l.blocked = ${blocked === 'true'}
        ORDER BY l.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (search) {
      logs = await queryMany`
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
        WHERE l.ip_address ILIKE '%${search}%' OR l.action_type ILIKE '%${search}%' OR l.endpoint ILIKE '%${search}%'
        ORDER BY l.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (risk !== 'all') {
      logs = await queryMany`
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
        WHERE l.risk_level = '${risk}'
        ORDER BY l.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (blocked !== 'all') {
      logs = await queryMany`
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
        WHERE l.blocked = ${blocked === 'true'}
        ORDER BY l.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      logs = await queryMany`
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
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

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

 
