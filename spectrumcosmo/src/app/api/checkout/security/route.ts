// app/api/checkout/security/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';
import { verifyCsrfToken } from '@/lib/csrf';

// Types
interface OrderData {
  email: string;
  totalAmount: number;
  phoneNumber?: string;
  deliveryAddress?: string;
  paymentMethod?: string;
}

interface FraudDetectionResult {
  isFraudulent: boolean;
  riskScore: number;
  reasons: string[];
}

interface FraudRules {
  maxOrderAmount: number;
  suspiciousEmailDomains: string[];
  riskThreshold: number;
}

// Default fraud rules (should come from database in production)
const DEFAULT_FRAUD_RULES: FraudRules = {
  maxOrderAmount: 5000,
  suspiciousEmailDomains: ['tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com'],
  riskThreshold: 50,
};

async function getFraudRules(): Promise<FraudRules> {
  try {
    const sql = getDb();
    const [settings] = await sql`
      SELECT value FROM site_settings WHERE key = 'fraud_rules'
    `;
    if (settings?.value) {
      return { ...DEFAULT_FRAUD_RULES, ...JSON.parse(settings.value) };
    }
  } catch {
    // Use defaults if database query fails
  }
  return DEFAULT_FRAUD_RULES;
}

async function detectFraud(
  orderData: OrderData,
  ipAddress: string,
  userId?: string
): Promise<FraudDetectionResult> {
  const rules = await getFraudRules();
  const reasons: string[] = [];
  let riskScore = 0;
  
  // Check order amount
  if (orderData.totalAmount > rules.maxOrderAmount) {
    riskScore += 30;
    reasons.push(`Order amount exceeds ${rules.maxOrderAmount} limit`);
  }
  
  // Check suspicious email domain
  const emailDomain = orderData.email?.split('@')[1]?.toLowerCase();
  if (emailDomain && rules.suspiciousEmailDomains.includes(emailDomain)) {
    riskScore += 40;
    reasons.push('Suspicious email domain detected');
  }
  
  // Check for user account age (if logged in)
  if (userId) {
    const sql = getDb();
    const [user] = await sql`
      SELECT created_at FROM users WHERE id = ${userId}
    `;
    
    if (user) {
      const accountAgeDays = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (accountAgeDays < 1) {
        riskScore += 20;
        reasons.push('New account with recent checkout');
      }
    }
  }
  
  return {
    isFraudulent: riskScore >= rules.riskThreshold,
    riskScore,
    reasons,
  };
}

function validateOrderData(data: unknown): data is OrderData {
  const order = data as OrderData;
  if (!order || typeof order !== 'object') return false;
  if (typeof order.email !== 'string' || !order.email) return false;
  if (typeof order.totalAmount !== 'number' || order.totalAmount <= 0) return false;
  return true;
}

export async function POST(req: NextRequest) {
  // CSRF Protection
  if (!verifyCsrfToken(req)) {
    return NextResponse.json({ error: 'Security validation failed' }, { status: 403 });
  }
  
  // Get authenticated user
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;
  
  const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
  
  try {
    const orderData = await req.json();
    
    // Validate input
    if (!validateOrderData(orderData)) {
      return NextResponse.json({ 
        error: 'Invalid order data provided' 
      }, { status: 400 });
    }
    
    const sql = getDb();
    
    // Run fraud detection
    const fraudResult = await detectFraud(orderData, ipAddress, user?.id);
    
    // Log checkout attempt
    await sql`
      INSERT INTO checkout_attempts (ip_address, user_id, email, attempt_type, details, created_at)
      VALUES (${ipAddress}, ${user?.id || null}, ${orderData.email}, ${fraudResult.isFraudulent ? 'blocked' : 'attempt'}, ${JSON.stringify(fraudResult)}, NOW())
    `;
    
    // Block fraudulent attempts
    if (fraudResult.isFraudulent) {
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
    
    // Return success with risk score for frontend to show warning if needed
    return NextResponse.json({ 
      success: true, 
      riskScore: fraudResult.riskScore,
      requiresReview: fraudResult.riskScore > 30,
      riskReasons: fraudResult.reasons,
    });
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    console.error('Checkout security error:', errorMessage);
    return NextResponse.json({ 
      error: 'Failed to process checkout. Please try again.' 
    }, { status: 500 });
  }
}
