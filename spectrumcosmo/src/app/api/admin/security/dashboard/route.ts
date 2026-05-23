import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const sql = getDb();
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('days') || '7');
  
  try {
    // Get security summary
    const [summary] = await sql`
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high,
        COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium,
        COUNT(CASE WHEN severity = 'low' THEN 1 END) as low,
        COUNT(DISTINCT ip_address) as unique_ips
      FROM security_logs
      WHERE created_at > NOW() - INTERVAL '${days} days'
    `;
    
    // Get daily trends
    const dailyTrends = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total,
        COUNT(CASE WHEN severity = 'high' OR severity = 'critical' THEN 1 END) as threats
      FROM security_logs
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    
    // Get top attack types
    const topAttacks = await sql`
      SELECT 
        action_type,
        COUNT(*) as count
      FROM security_logs
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY action_type
      ORDER BY count DESC
      LIMIT 10
    `;
    
    // Get top offending IPs
    const topIPs = await sql`
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
    
    // Get recent high severity alerts
    const recentAlerts = await sql`
      SELECT *
      FROM security_logs
      WHERE severity IN ('critical', 'high')
        AND created_at > NOW() - INTERVAL '1 day'
      ORDER BY created_at DESC
      LIMIT 50
    `;
    
    // Get system health
    const systemHealth = {
      rate_limits_active: await sql`SELECT COUNT(*) as count FROM security_rules WHERE expires_at IS NULL OR expires_at > NOW()`,
      blocked_ips: await sql`SELECT COUNT(*) as count FROM blocked_ips WHERE expires_at > NOW()`,
      active_sessions: await sql`SELECT COUNT(DISTINCT session_id) as count FROM sessions WHERE last_activity > NOW() - INTERVAL '15 minutes'`,
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
