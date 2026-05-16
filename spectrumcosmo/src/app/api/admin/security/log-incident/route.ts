import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { type, severity, ip, userAgent, endpoint, details } = await req.json();
    
    const sql = getDb();
    
    // Insert into security_logs
    await sql`
      INSERT INTO security_logs (
        action_type, endpoint, ip_address, user_agent, 
        risk_level, details, blocked, created_at
      ) VALUES (
        ${type}, ${endpoint}, ${ip}, ${userAgent},
        ${severity === 'high' ? 'high' : severity === 'critical' ? 'critical' : 'medium'},
        ${JSON.stringify(details)}, true, NOW()
      )
    `;
    
    // Create alert for high/critical severity
    if (severity === 'high' || severity === 'critical') {
      await sql`
        INSERT INTO security_alerts (
          alert_type, severity, title, description, 
          ip_address, endpoint, action_taken, created_at
        ) VALUES (
          ${type}, ${severity}, ${getAlertTitle(type)},
          ${getAlertDescription(type, details)}, ${ip}, ${endpoint},
          'Blocked', NOW()
        )
      `;
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to log incident:', err);
    return NextResponse.json({ error: 'Failed to log incident' }, { status: 500 });
  }
}

function getAlertTitle(type: string): string {
  const titles: Record<string, string> = {
    unauthorized_admin_access: 'Unauthorized Admin Access Attempt',
    bot_detected: 'Bot Activity Detected',
    rate_limit_exceeded: 'Rate Limit Exceeded',
    checkout_abuse: 'Checkout Abuse Detected',
    brute_force: 'Brute Force Attack Detected',
    sql_injection: 'SQL Injection Attempt',
  };
  return titles[type] || 'Suspicious Activity Detected';
}

function getAlertDescription(type: string, details: any): string {
  const descriptions: Record<string, string> = {
    unauthorized_admin_access: `Someone attempted to access admin area without proper authorization.`,
    bot_detected: `Bot-like behavior detected: ${details?.reason || 'rapid requests'}`,
    rate_limit_exceeded: `IP exceeded rate limit: ${details?.count}/${details?.limit} requests.`,
    checkout_abuse: `Multiple checkout attempts detected: ${details?.attempts} attempts.`,
  };
  return descriptions[type] || 'Suspicious activity was detected and blocked.';
}
