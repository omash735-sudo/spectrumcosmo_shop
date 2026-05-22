import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { getDb } from '@/lib/db'; // Adjust path to your database connection

// =============================================
// TEMPORARY DISABLE SWITCH - Set to true to re-enable all security features
// =============================================
const ENABLE_SECURITY_CHECKS = false;

// =============================================
// REDIS CLIENT
// =============================================
const redis = Redis.fromEnv();

// =============================================
// WHITELIST - These IPs are NEVER blocked
// =============================================
const WHITELIST_IPS = [
  '137.115.3.164',
  '102.70.104.115',
  '127.0.0.1',
  '::1',
];

function isWhitelisted(ip: string): boolean {
  return WHITELIST_IPS.includes(ip);
}

// =============================================
// TEST ACCOUNT HELPER
// =============================================
async function isTestAccountWriteBlocked(request: NextRequest): Promise<boolean> {
  const userToken = request.cookies.get('user_token')?.value;
  if (!userToken) return false;
  
  try {
    const decoded = JSON.parse(Buffer.from(userToken.split('.')[1], 'base64').toString());
    const userId = decoded.userId || decoded.id;
    
    if (!userId) return false;
    
    const sql = getDb();
    const [user] = await sql`
      SELECT is_test_account FROM users WHERE id = ${userId}
    `;
    
    if (!user?.is_test_account) return false;
    
    // Check kill switch - if test_account_enabled is 'false', write actions are blocked
    const [setting] = await sql`
      SELECT value FROM site_settings WHERE key = 'test_account_enabled'
    `;
    
    // Block write actions if kill switch is disabled (value !== 'true')
    return setting?.value !== 'true';
  } catch (err) {
    console.error('Failed to check test account status:', err);
    return false;
  }
}

// =============================================
// CACHED RULES (loaded once, refreshed via cron)
// =============================================
const DEFAULT_RULES = {
  rate_limiting: { enabled: true, max_requests: 60, window_seconds: 60 },
  suspicious_activity: { enabled: true, max_requests: 20, window_seconds: 10, block_minutes: 30 },
  checkout_protection: { enabled: true, max_attempts: 10, window_hours: 1 },
  bot_detection: { enabled: true },
  auto_block: { enabled: true, risk_threshold: 80, block_minutes: 30 },
  admin_protection: { enabled: true },
};

async function getCachedRules(): Promise<any> {
  try {
    const cached = await redis.get('security:rules');
    if (cached) return cached;
    return DEFAULT_RULES;
  } catch (err) {
    console.error('Failed to get cached rules:', err);
    return DEFAULT_RULES;
  }
}

async function getRule(ruleKey: string): Promise<any> {
  const rules = await getCachedRules();
  return rules[ruleKey] || { enabled: false };
}

async function isIpBlocked(ip: string): Promise<boolean> {
  if (!ENABLE_SECURITY_CHECKS) return false;
  const blocked = await redis.get(`blocked:${ip}`);
  return blocked !== null;
}

async function blockIp(ip: string, durationSeconds: number) {
  if (!ENABLE_SECURITY_CHECKS) return;
  await redis.setex(`blocked:${ip}`, durationSeconds, 'blocked');
}

async function logIncident(origin: string, type: string, severity: string, ip: string, userAgent: string, endpoint: string, details: any) {
  if (!ENABLE_SECURITY_CHECKS) return;
  try {
    await fetch(`${origin}/api/security/log-incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, severity, ip, userAgent, endpoint, details }),
    }).catch(() => {});
  } catch (err) {
    console.error('Failed to log incident:', err);
  }
}

async function logApiRequest(origin: string, endpoint: string, method: string, ip: string, userAgent: string, status: number, responseTimeMs: number) {
  if (!ENABLE_SECURITY_CHECKS) return;
  try {
    await fetch(`${origin}/api/log-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint, method, ip, userAgent, status, responseTimeMs }),
    }).catch(() => {});
  } catch (err) {
    console.error('Failed to log API request:', err);
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  const method = request.method;
  const startTime = Date.now();
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  // WHITELIST CHECK - Skip all blocking for whitelisted IPs
  if (isWhitelisted(ip)) {
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    return response;
  }

  // Skip all security checks for admin API routes
  if (pathname.startsWith('/api/admin/')) {
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    return response;
  }

  // =============================================
  // TEST ACCOUNT WRITE BLOCKING - Check BEFORE other security checks
  // =============================================
  const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (writeMethods.includes(method)) {
    const isWriteBlocked = await isTestAccountWriteBlocked(request);
    if (isWriteBlocked) {
      return NextResponse.json(
        { error: 'Test account is currently in read-only mode. Write actions are disabled.' },
        { status: 403 }
      );
    }
  }

  const skipPaths = [
    '/_next/', 
    '/favicon.ico', 
    '/api/track-session', 
    '/api/security/log-incident', 
    '/api/log-request', 
    '/api/cron/',
    '/api/admin/'
  ];
  const shouldSkip = skipPaths.some(path => pathname.includes(path));
  
  // Only run security checks if ENABLE_SECURITY_CHECKS is true
  if (!shouldSkip && ENABLE_SECURITY_CHECKS) {
    const blocked = await isIpBlocked(ip);
    if (blocked) {
      return NextResponse.json(
        { error: 'Your IP has been blocked due to suspicious activity. Please contact support.' },
        { status: 403 }
      );
    }

    const rateLimitingRule = await getRule('rate_limiting');
    const suspiciousRule = await getRule('suspicious_activity');
    const checkoutRule = await getRule('checkout_protection');
    const autoBlockRule = await getRule('auto_block');

    if (rateLimitingRule.enabled) {
      const maxRequests = rateLimitingRule.max_requests || 60;
      const windowSeconds = rateLimitingRule.window_seconds || 60;
      const rateKey = `rate:${ip}`;
      
      const current = await redis.incr(rateKey);
      if (current === 1) await redis.expire(rateKey, windowSeconds);
      if (current > maxRequests) {
        await logIncident(origin, 'rate_limit_exceeded', 'medium', ip, userAgent, pathname, { count: current, limit: maxRequests });
        return NextResponse.json({ error: 'Rate limit exceeded. Please slow down.' }, { status: 429 });
      }
    }

    if (suspiciousRule.enabled) {
      const maxRequests = suspiciousRule.max_requests || 20;
      const windowSeconds = suspiciousRule.window_seconds || 10;
      const blockMinutes = suspiciousRule.block_minutes || 30;
      const suspiciousKey = `suspicious:${ip}`;
      
      const current = await redis.incr(suspiciousKey);
      if (current === 1) await redis.expire(suspiciousKey, windowSeconds);
      if (current > maxRequests) {
        if (autoBlockRule.enabled) await blockIp(ip, blockMinutes * 60);
        await logIncident(origin, 'bot_detected', 'high', ip, userAgent, pathname, { request_count: current, reason: 'rapid_requests' });
        return NextResponse.json({ error: 'Suspicious activity detected. Access blocked.' }, { status: 403 });
      }
    }

    if (checkoutRule.enabled && (pathname.includes('/checkout') || pathname.includes('/api/checkout'))) {
      const maxAttempts = checkoutRule.max_attempts || 10;
      const windowHours = checkoutRule.window_hours || 1;
      const windowSeconds = windowHours * 60 * 60;
      const checkoutKey = `checkout:${ip}`;
      
      const current = await redis.incr(checkoutKey);
      if (current === 1) await redis.expire(checkoutKey, windowSeconds);
      if (current > maxAttempts) {
        await logIncident(origin, 'checkout_abuse', 'high', ip, userAgent, pathname, { attempts: current, limit: maxAttempts });
        return NextResponse.json({ error: 'Too many checkout attempts. Please try again later.' }, { status: 429 });
      }
    }

    const botRule = await getRule('bot_detection');
    if (botRule.enabled && !pathname.includes('/api/')) {
      const isBot = !userAgent || 
                    /bot|crawl|scrape|python|curl|wget|headless/i.test(userAgent) ||
                    !request.headers.get('accept') ||
                    !request.headers.get('accept-language');
      if (isBot) {
        await logIncident(origin, 'bot_detected', 'medium', ip, userAgent, pathname, { reason: 'missing_headers_or_bot_user_agent', user_agent: userAgent });
      }
    }
  }

  const adminRule = await getRule('admin_protection');
  const adminToken = request.cookies.get('admin_token')?.value;
  const isAdminLogin = pathname === '/admin/login';
  
  if (adminRule.enabled && pathname.startsWith('/admin') && !isAdminLogin && !adminToken) {
    await logIncident(origin, 'unauthorized_admin_access', 'high', ip, userAgent, pathname, { attempted_access: pathname, missing_token: true });
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const userToken = request.cookies.get('user_token')?.value;
  if (pathname.startsWith('/account') && !userToken) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  const response = NextResponse.next();

  const skipTrackingPaths = [
    '/api/', '/_next/', '/favicon.ico', 
    '/admin/', '/admin/login', '/auth/login', '/auth/register',
    '/login', '/register'
  ];
  const shouldSkipTracking = skipTrackingPaths.some(p => pathname.startsWith(p));
  
  if (!shouldSkipTracking && !pathname.startsWith('/api/')) {
    let sessionId = request.cookies.get('user_session_id')?.value;
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      response.cookies.set('user_session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        sameSite: 'lax',
      });
    }
    
    let userId = null;
    if (userToken) {
      try {
        const decoded = JSON.parse(Buffer.from(userToken.split('.')[1], 'base64').toString());
        userId = decoded.userId || decoded.id || null;
      } catch (err) {}
    }
    
    fetch(`${origin}/api/track-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userId, pageUrl: pathname, userAgent, ipAddress: ip, referrer: request.headers.get('referer') || '' }),
    }).catch(() => {});
  }

  if (pathname.startsWith('/api/') && !pathname.includes('/api/track-session') && !pathname.includes('/api/security/log-incident') && !pathname.includes('/api/log-request')) {
    const responseTime = Date.now() - startTime;
    logApiRequest(origin, pathname, method, ip, userAgent, response.status, responseTime);
  }

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*', 
    '/account/:path*',
    '/',
    '/products/:path*',
    '/product/:path*',
    '/reviews/:path*',
    '/about',
    '/contact',
    '/newsletter',
    '/checkout/:path*',
    '/api/:path*',
  ],
};
