// app/api/admin/security/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth';

// Types
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

// Database row types
interface SummaryRow {
  total_events: string | number;
  critical: string | number;
  high: string | number;
  medium: string | number;
  low: string | number;
  unique_ips: string | number;
}

interface DailyTrendRow {
  date: string;
  total: string | number;
  threats: string | number;
}

interface AttackTypeRow {
  action_type: string;
  count: string | number;
}

interface TopIPRow {
  ip_address: string;
  attempts: string | number;
  blocked: string | number;
}

interface RecentAlertRow {
  id: string;
  action_type: string;
  severity: string;
  ip_address: string;
  details: string;
  created_at: Date;
}

interface CountRow {
  count: string | number;
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
  // Limit to reasonable range (1-90 days)
  return Math.min(Math.max(days, 1), 90);
}

export async function GET(req: NextRequest) {
  // Authenticate admin
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const sql = getDb();
  const { searchParams } = new URL(req.url);
  const days = validateDaysParam(searchParams.get('days'));
  
  // Default empty response structure
  const defaultResponse: SecurityDashboardData = {
    summary: { total_events: 0, critical: 0, high: 0, medium: 0, low: 0, unique_ips: 0 },
    dailyTrends: [],
    topAttacks: [],
    topIPs: [],
    recentAlerts: [],
    systemHealth: { rate_limits_active: 0, blocked_ips: 0, active_sessions: 0 },
  };
  
  try {
    // Get security summary
    let summary: SecuritySummary = { ...defaultResponse.summary };
    try {
      const [result] = await sql`
        SELECT 
          COALESCE(COUNT(*), 0) as total_events,
          COALESCE(COUNT(CASE WHEN severity = 'critical' THEN 1 END), 0) as critical,
          COALESCE(COUNT(CASE WHEN severity = 'high' THEN 1 END), 0) as high,
          COALESCE(COUNT(CASE WHEN severity = 'medium' THEN 1 END), 0) as medium,
          COALESCE(COUNT(CASE WHEN severity = 'low' THEN 1 END), 0) as low,
          COALESCE(COUNT(DISTINCT ip_address), 0) as unique_ips
        FROM security_logs
        WHERE created_at > NOW() - INTERVAL '${days} days'
      ` as SummaryRow[];
      
      if (result) {
        summary = {
          total_events: safeParseInt(result.total_events),
          critical: safeParseInt(result.critical),
          high: safeParseInt(result.high),
          medium: safeParseInt(result.medium),
          low: safeParseInt(result.low),
          unique_ips: safeParseInt(result.unique_ips),
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to fetch security summary:', errorMessage);
      // Continue with default summary
    }
    
    // Get daily trends
    let dailyTrends: DailyTrend[] = [];
    try {
      const rows = await sql`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total,
          COUNT(CASE WHEN severity IN ('high', 'critical') THEN 1 END) as threats
        FROM security_logs
        WHERE created_at > NOW() - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      ` as DailyTrendRow[];
      
      dailyTrends = rows.map((row: DailyTrendRow) => ({
        date: row.date,
        total: safeParseInt(row.total),
        threats: safeParseInt(row.threats),
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to fetch daily trends:', errorMessage);
    }
    
    // Get top attack types
    let topAttacks: AttackType[] = [];
    try {
      const rows = await sql`
        SELECT 
          action_type,
          COUNT(*) as count
        FROM security_logs
        WHERE created_at > NOW() - INTERVAL '${days} days'
        GROUP BY action_type
        ORDER BY count DESC
        LIMIT 10
      ` as AttackTypeRow[];
      
      topAttacks = rows.map((row: AttackTypeRow) => ({
        action_type: row.action_type,
        count: safeParseInt(row.count),
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to fetch top attacks:', errorMessage);
    }
    
    // Get top offending IPs
    let topIPs: TopIP[] = [];
    try {
      const rows = await sql`
        SELECT 
          ip_address,
          COUNT(*) as attempts,
          COUNT(CASE WHEN blocked = true THEN 1 END) as blocked
        FROM security_logs
        WHERE created_at > NOW() - INTERVAL '${days} days'
        GROUP BY ip_address
        ORDER BY attempts DESC
        LIMIT 20
      ` as TopIPRow[];
      
      topIPs = rows.map((row: TopIPRow) => ({
        ip_address: row.ip_address,
        attempts: safeParseInt(row.attempts),
        blocked: safeParseInt(row.blocked),
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to fetch top IPs:', errorMessage);
    }
    
    // Get recent high severity alerts
    let recentAlerts: RecentAlert[] = [];
    try {
      const rows = await sql`
        SELECT id, action_type, severity, ip_address, details, created_at
        FROM security_logs
        WHERE severity IN ('critical', 'high')
          AND created_at > NOW() - INTERVAL '1 day'
        ORDER BY created_at DESC
        LIMIT 50
      ` as RecentAlertRow[];
      
      recentAlerts = rows.map((row: RecentAlertRow) => ({
        id: row.id,
        action_type: row.action_type,
        severity: row.severity,
        ip_address: row.ip_address,
        details: row.details,
        created_at: row.created_at,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to fetch recent alerts:', errorMessage);
    }
    
    // Get system health metrics
    let rateLimitsCount = 0;
    let blockedIPsCount = 0;
    let activeSessionsCount = 0;
    
    try {
      const [rateLimits] = await sql`
        SELECT COUNT(*) as count FROM security_rules 
        WHERE expires_at IS NULL OR expires_at > NOW()
      ` as CountRow[];
      rateLimitsCount = safeParseInt(rateLimits?.count);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.warn('Could not fetch rate limits:', errorMessage);
    }
    
    try {
      const [blocked] = await sql`
        SELECT COUNT(*) as count FROM blocked_ips 
        WHERE expires_at > NOW()
      ` as CountRow[];
      blockedIPsCount = safeParseInt(blocked?.count);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.warn('Could not fetch blocked IPs:', errorMessage);
    }
    
    try {
      const [sessions] = await sql`
        SELECT COUNT(DISTINCT session_id) as count FROM sessions 
        WHERE last_activity > NOW() - INTERVAL '15 minutes'
      ` as CountRow[];
      activeSessionsCount = safeParseInt(sessions?.count);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.warn('Could not fetch active sessions:', errorMessage);
    }
    
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
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    console.error('Security dashboard fatal error:', errorMessage);
    // Return safe default structure
    return NextResponse.json(defaultResponse, { status: 500 });
  }
}
