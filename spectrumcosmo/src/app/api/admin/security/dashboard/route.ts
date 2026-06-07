// app/api/admin/security/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryMany, queryAsArray } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

// Types (unchanged)
interface SecuritySummary {
  total_events: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  unique_ips: number;
}

interface DailyTrend {
  date: string;
  total: number;
  threats: number;
}

interface AttackType {
  action_type: string;
  count: number;
}

interface TopIP {
  ip_address: string;
  attempts: number;
  blocked: number;
}

interface RecentAlert {
  id: string;
  action_type: string;
  severity: string;
  ip_address: string;
  details: string;
  created_at: Date;
}

interface SystemHealth {
  rate_limits_active: number;
  blocked_ips: number;
  active_sessions: number;
}

interface SecurityDashboardData {
  summary: SecuritySummary;
  dailyTrends: DailyTrend[];
  topAttacks: AttackType[];
  topIPs: TopIP[];
  recentAlerts: RecentAlert[];
  systemHealth: SystemHealth;
}

// Helper function to safely parse integer
function safeParseInt(value: string | number | null | undefined, defaultValue: number = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

// Validate days parameter
function validateDaysParam(daysParam: string | null): number {
  if (!daysParam) return 7;
  const days = parseInt(daysParam, 10);
  if (isNaN(days)) return 7;
  return Math.min(Math.max(days, 1), 90);
}

export async function GET(req: NextRequest) {
  // Authenticate admin
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = validateDaysParam(searchParams.get('days'));

  const defaultResponse: SecurityDashboardData = {
    summary: { total_events: 0, critical: 0, high: 0, medium: 0, low: 0, unique_ips: 0 },
    dailyTrends: [],
    topAttacks: [],
    topIPs: [],
    recentAlerts: [],
    systemHealth: { rate_limits_active: 0, blocked_ips: 0, active_sessions: 0 },
  };

  try {
    // 1. Security summary (single row)
    const summaryRow = await queryOne<{
      total_events: string | number;
      critical: string | number;
      high: string | number;
      medium: string | number;
      low: string | number;
      unique_ips: string | number;
    }>`
      SELECT 
        COALESCE(COUNT(*), 0) as total_events,
        COALESCE(COUNT(CASE WHEN severity = 'critical' THEN 1 END), 0) as critical,
        COALESCE(COUNT(CASE WHEN severity = 'high' THEN 1 END), 0) as high,
        COALESCE(COUNT(CASE WHEN severity = 'medium' THEN 1 END), 0) as medium,
        COALESCE(COUNT(CASE WHEN severity = 'low' THEN 1 END), 0) as low,
        COALESCE(COUNT(DISTINCT ip_address), 0) as unique_ips
      FROM security_logs
      WHERE created_at > NOW() - INTERVAL '${days} days'
    `;

    const summary: SecuritySummary = {
      total_events: safeParseInt(summaryRow?.total_events),
      critical: safeParseInt(summaryRow?.critical),
      high: safeParseInt(summaryRow?.high),
      medium: safeParseInt(summaryRow?.medium),
      low: safeParseInt(summaryRow?.low),
      unique_ips: safeParseInt(summaryRow?.unique_ips),
    };

    // 2. Daily trends (multiple rows)
    const dailyRows = await queryMany<{
      date: string;
      total: string | number;
      threats: string | number;
    }>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        COUNT(CASE WHEN severity IN ('high', 'critical') THEN 1 END) as threats
      FROM security_logs
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const dailyTrends: DailyTrend[] = dailyRows.map((row) => ({
      date: row.date,
      total: safeParseInt(row.total),
      threats: safeParseInt(row.threats),
    }));

    // 3. Top attack types
    const attackRows = await queryMany<{
      action_type: string;
      count: string | number;
    }>`
      SELECT 
        action_type,
        COUNT(*) as count
      FROM security_logs
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY action_type
      ORDER BY count DESC
      LIMIT 10
    `;

    const topAttacks: AttackType[] = attackRows.map((row) => ({
      action_type: row.action_type,
      count: safeParseInt(row.count),
    }));

    // 4. Top offending IPs
    const ipRows = await queryMany<{
      ip_address: string;
      attempts: string | number;
      blocked: string | number;
    }>`
      SELECT 
        ip_address,
        COUNT(*) as attempts,
        COUNT(CASE WHEN blocked = true THEN 1 END) as blocked
      FROM security_logs
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY ip_address
      ORDER BY attempts DESC
      LIMIT 20
    `;

    const topIPs: TopIP[] = ipRows.map((row) => ({
      ip_address: row.ip_address,
      attempts: safeParseInt(row.attempts),
      blocked: safeParseInt(row.blocked),
    }));

    // 5. Recent high severity alerts
    const alertRows = await queryMany<{
      id: string;
      action_type: string;
      severity: string;
      ip_address: string;
      details: string;
      created_at: Date;
    }>`
      SELECT id, action_type, severity, ip_address, details, created_at
      FROM security_logs
      WHERE severity IN ('critical', 'high')
        AND created_at > NOW() - INTERVAL '1 day'
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const recentAlerts: RecentAlert[] = alertRows.map((row) => ({
      id: row.id,
      action_type: row.action_type,
      severity: row.severity,
      ip_address: row.ip_address,
      details: row.details,
      created_at: row.created_at,
    }));

    // 6. System health metrics (each is a single row)
    const rateLimitsRow = await queryOne<{ count: string | number }>`
      SELECT COUNT(*) as count FROM security_rules 
      WHERE expires_at IS NULL OR expires_at > NOW()
    `;
    const rateLimitsCount = safeParseInt(rateLimitsRow?.count);

    const blockedIPsRow = await queryOne<{ count: string | number }>`
      SELECT COUNT(*) as count FROM blocked_ips 
      WHERE expires_at > NOW()
    `;
    const blockedIPsCount = safeParseInt(blockedIPsRow?.count);

    const sessionsRow = await queryOne<{ count: string | number }>`
      SELECT COUNT(DISTINCT session_id) as count FROM sessions 
      WHERE last_activity > NOW() - INTERVAL '15 minutes'
    `;
    const activeSessionsCount = safeParseInt(sessionsRow?.count);

    const systemHealth: SystemHealth = {
      rate_limits_active: rateLimitsCount,
      blocked_ips: blockedIPsCount,
      active_sessions: activeSessionsCount,
    };

    return NextResponse.json({
      summary,
      dailyTrends,
      topAttacks,
      topIPs,
      recentAlerts,
      systemHealth,
    });
  } catch (err) {
    console.error('Security dashboard error:', err);
    return NextResponse.json(defaultResponse, { status: 500 });
  }
}
