import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { getVerifiedAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedAdmin(req);

  if (error || !user || !user.is_admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const summary = await queryOne<{
      total_events: number | string;
      failed_logins: number | string;
      suspicious_ips: number | string;
    }>`
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN action_type = 'login_failed' THEN 1 END) as failed_logins,
        COUNT(DISTINCT ip_address) as suspicious_ips
      FROM security_logs
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `;

    const blocked = await queryOne<{ count: number | string }>`
      SELECT COUNT(*) as count FROM blocked_ips
      WHERE expires_at IS NULL OR expires_at > NOW()
    `;

    const scoreResult = await queryOne<{ score: number | string }>`
      SELECT 
        LEAST(100, 
          100 - (
            (COUNT(CASE WHEN risk_level IN ('critical', 'high') THEN 1 END) * 5) +
            (COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) * 2)
          )
        ) as score
      FROM security_logs
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `;

    const twofaResult = await queryOne<{ enabled: number | string }>`
      SELECT COUNT(*) as enabled FROM twofa_settings 
      WHERE user_id = ${user.id} AND enabled = true
    `;

    const threatsResult = await queryOne<{ count: number | string }>`
      SELECT COUNT(*) as count FROM security_logs
      WHERE risk_level IN ('critical', 'high') 
        AND created_at >= NOW() - INTERVAL '1 hour'
        AND blocked = false
    `;

    const totalEvents = Number(summary?.total_events ?? 0);
    const failedLogins = Number(summary?.failed_logins ?? 0);
    const suspiciousIps = Number(summary?.suspicious_ips ?? 0);
    const blockedIps = Number(blocked?.count ?? 0);
    const securityScore = Math.min(100, Number(scoreResult?.score ?? 80));
    const twofaEnabled = Number(twofaResult?.enabled ?? 0) > 0;
    const activeThreats = Number(threatsResult?.count ?? 0);

    return NextResponse.json({
      total_events: totalEvents,
      failed_logins: failedLogins,
      suspicious_ips: suspiciousIps,
      blocked_ips: blockedIps,
      security_score: securityScore,
      twofa_enabled: twofaEnabled,
      active_threats: activeThreats,
      last_scan: new Date().toISOString(),
      window: '7d',
    });
  } catch (err) {
    console.error('Failed to fetch summary:', err);
    return NextResponse.json(
      { 
        error: 'Failed to fetch summary',
        total_events: 0,
        failed_logins: 0,
        suspicious_ips: 0,
        blocked_ips: 0,
        security_score: 80,
        twofa_enabled: false,
        active_threats: 0,
        last_scan: new Date().toISOString(),
      }, 
      { status: 500 }
    );
  }
}
