import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminFromRequest } from '@/lib/auth'; // ← CHANGE THIS

export async function GET(req: NextRequest) {
  // Use getAdminFromRequest instead of getVerifiedUser
  const admin = getAdminFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const sql = getDb();
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '7');
  
  try {
    // Get security summary - with fallback if table empty
    let summary = { total_events: 0, critical: 0, high: 0, medium: 0, low: 0, unique_ips: 0 };
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
      `;
      if (result) {
        summary = {
          total_events: parseInt(result.total_events || '0'),
          critical: parseInt(result.critical || '0'),
          high: parseInt(result.high || '0'),
          medium: parseInt(result.medium || '0'),
          low: parseInt(result.low || '0'),
          unique_ips: parseInt(result.unique_ips || '0'),
        };
      }
    } catch (err) {
      console.warn('Could not fetch summary, table might not exist:', err);
    }
    
    // Get daily trends
    let dailyTrends = [];
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
      `;
      dailyTrends = rows.map(row => ({
        date: row.date,
        total: parseInt(row.total || '0'),
        threats: parseInt(row.threats || '0'),
      }));
    } catch (err) {
      console.warn('Could not fetch daily trends:', err);
    }
    
    // Get top attack types
    let topAttacks = [];
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
      `;
      topAttacks = rows.map(row => ({ action_type: row.action_type, count: parseInt(row.count || '0') }));
    } catch (err) {
      console.warn('Could not fetch top attacks:', err);
    }
    
    // Get top offending IPs
    let topIPs = [];
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
      `;
      topIPs = rows.map(row => ({
        ip_address: row.ip_address,
        attempts: parseInt(row.attempts || '0'),
        blocked: parseInt(row.blocked || '0'),
      }));
    } catch (err) {
      console.warn('Could not fetch top IPs:', err);
    }
    
    // Get recent high severity alerts
    let recentAlerts = [];
    try {
      const rows = await sql`
        SELECT id, action_type, severity, ip_address, details, created_at
        FROM security_logs
        WHERE severity IN ('critical', 'high')
          AND created_at > NOW() - INTERVAL '1 day'
        ORDER BY created_at DESC
        LIMIT 50
      `;
      recentAlerts = rows.map(row => ({
        id: row.id,
        action_type: row.action_type,
        severity: row.severity,
        ip_address: row.ip_address,
        details: row.details,
        created_at: row.created_at,
      }));
    } catch (err) {
      console.warn('Could not fetch recent alerts:', err);
    }
    
    // Get system health with fallbacks
    let rateLimitsCount = 0;
    let blockedIPsCount = 0;
    let activeSessionsCount = 0;
    
    try {
      const [rateLimits] = await sql`SELECT COUNT(*) as count FROM security_rules WHERE expires_at IS NULL OR expires_at > NOW()`;
      rateLimitsCount = parseInt(rateLimits?.count || '0');
    } catch {}
    
    try {
      const [blocked] = await sql`SELECT COUNT(*) as count FROM blocked_ips WHERE expires_at > NOW()`;
      blockedIPsCount = parseInt(blocked?.count || '0');
    } catch {}
    
    try {
      const [sessions] = await sql`SELECT COUNT(DISTINCT session_id) as count FROM sessions WHERE last_activity > NOW() - INTERVAL '15 minutes'`;
      activeSessionsCount = parseInt(sessions?.count || '0');
    } catch {}
    
    const systemHealth = {
      rate_limits_active: [{ count: rateLimitsCount }],
      blocked_ips: [{ count: blockedIPsCount }],
      active_sessions: [{ count: activeSessionsCount }],
    };
    
    return NextResponse.json({
      summary,
      dailyTrends,
      topAttacks,
      topIPs,
      recentAlerts,
      systemHealth,
    });
  } catch (err: any) {
    console.error('Security dashboard error:', err);
    // Return a valid default structure so the frontend doesn't crash
    return NextResponse.json({
      summary: { total_events: 0, critical: 0, high: 0, medium: 0, low: 0, unique_ips: 0 },
      dailyTrends: [],
      topAttacks: [],
      topIPs: [],
      recentAlerts: [],
      systemHealth: {
        rate_limits_active: [{ count: 0 }],
        blocked_ips: [{ count: 0 }],
        active_sessions: [{ count: 0 }],
      },
    });
  }
}
