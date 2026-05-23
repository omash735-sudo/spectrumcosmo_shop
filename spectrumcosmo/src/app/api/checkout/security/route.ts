import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';
import { verifyCsrfToken } from '@/lib/csrf';
import { rateLimit } from '@/lib/rate-limit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Fraud detection rules
const FRAUD_RULES = {
  maxOrderAmount: 5000, // USD
  maxAttemptsPerHour: 10,
  highRiskCountries: ['NG', 'KE', 'PK', 'VN'], // Example
  suspiciousEmailDomains: ['tempmail.com', '10minutemail.com', 'guerrillamail.com'],
};

async function detectFraud(orderData: any, ipAddress: string, userId?: string): Promise<{ isFraudulent: boolean; riskScore: number; reasons: string[] }> {
  const reasons: string[] = [];
  let riskScore = 0;
  
  // Check order amount
  if (orderData.totalAmount > FRAUD_RULES.maxOrderAmount) {
    riskScore += 30;
    reasons.push('High order amount');
  }
  
  // Check suspicious email
  const emailDomain = orderData.email?.split('@')[1];
  if (emailDomain && FRAUD_RULES.suspiciousEmailDomains.includes(emailDomain)) {
    riskScore += 40;
    reasons.push('Suspicious email domain');
  }
  
  // Check rapid attempts
  const attemptCount = await redis.incr(`checkout:attempts:${ipAddress}`);
  await redis.expire(`checkout:attempts:${ipAddress}`, 3600);
  
  if (attemptCount > FRAUD_RULES.maxAttemptsPerHour) {
    riskScore += 50;
    reasons.push('Too many checkout attempts');
  }
  
  // Check for VPN/proxy (you'd need an IP lookup service)
  // This is a placeholder - integrate with ipapi.co or similar
  
  return {
    isFraudulent: riskScore >= 50,
    riskScore,
    reasons,
  };
}

export async function POST(req: NextRequest) {
  // CSRF Protection
  if (!verifyCsrfToken(req)) {
    return NextResponse.json({ error: 'Security validation failed' }, { status: 403 });
  }
  
  // Rate limiting
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const rateResult = await rateLimit(`checkout:${ipAddress}`, 10, 3600);
  
  if (!rateResult.success) {
    return NextResponse.json({ 
      error: `Too many checkout attempts. Try again in ${rateResult.retryAfter} minutes` 
    }, { status: 429 });
  }
  
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;
  
  try {
    const orderData = await req.json();
    const sql = getDb();
    
    // Run fraud detection
    const fraudResult = await detectFraud(orderData, ipAddress, user?.id);
    
    // Log checkout attempt
    await sql`
      INSERT INTO checkout_attempts (ip_address, user_id, email, attempt_type, details, created_at)
      VALUES (${ipAddress}, ${user?.id || null}, ${orderData.email || null}, ${fraudResult.isFraudulent ? 'blocked' : 'attempt'}, ${JSON.stringify(fraudResult)}, NOW())
    `;
    
    if (fraudResult.isFraudulent) {
      // Block the checkout
      await redis.setex(`blocked:checkout:${ipAddress}`, 3600, 'fraud_detected');
      
      // Log security incident
      await sql`
        INSERT INTO security_logs (user_id, action_type, severity, ip_address, details, created_at)
        VALUES (${user?.id || null}, 'fraud_detected', 'high', ${ipAddress}, ${JSON.stringify(fraudResult)}, NOW())
      `;
      
      return NextResponse.json({ 
        error: 'Order validation failed. Please contact support.',
        fraudDetected: true 
      }, { status: 403 });
    }
    
    // Proceed with checkout
    return NextResponse.json({ 
      success: true, 
      riskScore: fraudResult.riskScore,
      requiresReview: fraudResult.riskScore > 30
    });
    
  } catch (err: any) {
    console.error('Checkout security error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
