import { getDb } from './db';

interface SecurityLogParams {
  userId?: number | null;
  actionType: string;
  endpoint: string;
  requestMethod: string;
  requestBody?: any;
  responseStatus: number;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

export async function logSecurityEvent(params: SecurityLogParams) {
  try {
    const sql = getDb();
    
    const riskScore = await calculateRiskScore(params);
    const riskLevel = getRiskLevel(riskScore);
    
    await sql`
      INSERT INTO security_logs (
        user_id, action_type, endpoint, request_method, request_body,
        response_status, ip_address, user_agent, risk_score, risk_level,
        details, created_at
      ) VALUES (
        ${params.userId || null}, ${params.actionType}, ${params.endpoint},
        ${params.requestMethod}, ${params.requestBody ? JSON.stringify(params.requestBody) : null},
        ${params.responseStatus}, ${params.ipAddress || null}, ${params.userAgent || null},
        ${riskScore}, ${riskLevel}, ${params.details ? JSON.stringify(params.details) : null},
        NOW()
      )
    `;
    
    if (riskLevel === 'critical' || riskLevel === 'high') {
      await handleSuspiciousActivity(params.ipAddress, riskLevel);
    }
  } catch (err) {
    console.error('Failed to log security event:', err);
  }
}

async function calculateRiskScore(params: SecurityLogParams): Promise<number> {
  let score = 0;
  
  if (params.responseStatus === 401 || params.responseStatus === 403) {
    score += 30;
  }
  
  if (params.responseStatus >= 500) {
    score += 10;
  }
  
  if (params.endpoint.includes('/admin') && params.responseStatus === 403) {
    score += 50;
  }
  
  if (params.actionType === 'failed_login' && params.responseStatus === 401) {
    const recentFails = await getRecentFailedAttempts(params.ipAddress);
    score += Math.min(recentFails * 10, 50);
  }
  
  if (params.actionType === 'password_reset_attempt' && params.responseStatus === 401) {
    score += 40;
  }
  
  return Math.min(score, 100);
}

function getRiskLevel(score: number): string {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

async function getRecentFailedAttempts(ipAddress?: string): Promise<number> {
  if (!ipAddress) return 0;
  
  try {
    const sql = getDb();
    const result = await sql`
      SELECT COUNT(*) as count FROM failed_login_attempts
      WHERE ip_address = ${ipAddress}
      AND attempted_at >= NOW() - INTERVAL '15 minutes'
    `;
    return Number(result[0]?.count) || 0;
  } catch {
    return 0;
  }
}

async function handleSuspiciousActivity(ipAddress?: string, riskLevel?: string) {
  if (!ipAddress) return;
  
  if (riskLevel === 'critical') {
    try {
      const sql = getDb();
      await sql`
        INSERT INTO blocked_ips (ip_address, reason, expires_at, created_at)
        VALUES (${ipAddress}, 'Automatic block due to critical risk level', NOW() + INTERVAL '1 hour', NOW())
        ON CONFLICT (ip_address) DO NOTHING
      `;
    } catch (err) {
      console.error('Failed to block IP:', err);
    }
  }
}

export async function isIPBlocked(ipAddress: string): Promise<boolean> {
  try {
    const sql = getDb();
    const result = await sql`
      SELECT id FROM blocked_ips
      WHERE ip_address = ${ipAddress}
      AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
    `;
    return result.length > 0;
  } catch {
    return false;
  }
}

export async function recordFailedLogin(email: string, ipAddress: string) {
  try {
    const sql = getDb();
    await sql`
      INSERT INTO failed_login_attempts (email, ip_address, attempted_at)
      VALUES (${email}, ${ipAddress}, NOW())
    `;
    
    const recentAttempts = await sql`
      SELECT COUNT(*) as count FROM failed_login_attempts
      WHERE ip_address = ${ipAddress}
      AND attempted_at >= NOW() - INTERVAL '15 minutes'
    `;
    
    const attempts = Number(recentAttempts[0]?.count) || 0;
    
    if (attempts >= 10) {
      await sql`
        INSERT INTO blocked_ips (ip_address, reason, expires_at, created_at)
        VALUES (${ipAddress}, 'Too many failed login attempts', NOW() + INTERVAL '30 minutes', NOW())
        ON CONFLICT (ip_address) DO UPDATE SET expires_at = NOW() + INTERVAL '30 minutes'
      `;
    }
  } catch (err) {
    console.error('Failed to record failed login:', err);
  }
}
