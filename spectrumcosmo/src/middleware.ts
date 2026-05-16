import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRuleConfig, isRuleEnabled } from '@/lib/rule-engine';

// =============================================
// PROTECTION STORES (In-memory - use Redis in production)
// =============================================
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const failedLoginStore = new Map<string, { attempts: number; firstAttempt: number; blockedUntil: number }>();
const suspiciousActivityStore = new Map<string, { count: number; firstActivity: number }>();
const checkoutStore = new Map<string, { count: number; resetTime: number }>();

// Cache for dynamic rules (refresh every 60 seconds)
let rulesCache: {
  rateLimiting: any;
  suspiciousActivity: any;
  checkoutProtection: any;
  autoBlock: any;
} | null = null;
let lastRuleRefresh = 0;
const RULE_CACHE_TTL = 60000; // 60 seconds

async function loadDynamicRules() {
  const now = Date.now();
  if (rulesCache && now - lastRuleRefresh < RULE_CACHE_TTL) {
    return rulesCache;
  }
  
  const rateLimitingEnabled = await isRuleEnabled('rate_limiting');
  const suspiciousEnabled = await isRuleEnabled('suspicious_activity');
  const checkoutEnabled = await isRuleEnabled('checkout_protection');
  const autoBlockEnabled = await isRuleEnabled('auto_block');
  
  const rateLimitingConfig = rateLimitingEnabled ? await getRuleConfig('rate_limiting') : null;
  const suspiciousConfig = suspiciousEnabled ? await getRuleConfig('suspicious_activity') : null;
  const checkoutConfig = checkoutEnabled ? await getRuleConfig('checkout_protection') : null;
  const autoBlockConfig = autoBlockEnabled ? await getRuleConfig('auto_block') : null;
  
  rulesCache = {
    rateLimiting: {
      enabled: rateLimitingEnabled,
      maxRequests: rateLimitingConfig?.max_requests || 60,
      windowMs: (rateLimitingConfig?.window_seconds || 60) * 1000,
    },
    suspiciousActivity: {
      enabled: suspiciousEnabled,
      maxRequests: suspiciousConfig?.max_requests || 20,
      windowMs: (suspiciousConfig?.window_seconds || 10) * 1000,
      blockDurationMs: (suspiciousConfig?.block_minutes || 30) * 60 * 1000,
    },
    checkoutProtection: {
      enabled: checkoutEnabled,
      maxAttempts: checkoutConfig?.max_attempts || 10,
      windowMs: (checkoutConfig?.window_hours || 1) * 60 * 60 * 1000,
    },
    autoBlock: {
      enabled: autoBlockEnabled,
      riskScoreThreshold: autoBlockConfig?.risk_threshold || 80,
      blockDurationMs: (autoBlockConfig?.block_minutes || 30) * 60 * 1000,
    },
  };
  
  lastRuleRefresh = now;
  return rulesCache;
}

// =============================================
// HELPER: Clean up expired entries
// =============================================
function cleanupStores() {
  const now = Date.now();
  
  for (const [key, value] of rateLimitStore) {
    if (now > value.resetTime) rateLimitStore.delete(key);
  }
  for (const [key, value] of failedLoginStore) {
    if (value.blockedUntil && now > value.blockedUntil) failedLoginStore.delete(key);
    else if (now > value.firstAttempt + 10 * 60 * 1000) failedLoginStore.delete(key);
  }
  for (const [key, value] of suspiciousActivityStore) {
    if (now > value.firstActivity + 10 * 1000) suspiciousActivityStore.delete(key);
  }
  for (const [key, value] of checkoutStore) {
    if (now > value.resetTime) checkoutStore.delete(key);
  }
}

// Run cleanup every minute
setInterval(cleanupStores, 60 * 1000);
setInterval(() => { rulesCache = null; }, RULE_CACHE_TTL);

// =============================================
// HELPER: Log security incidents
// =============================================
async function logIncident(origin: string, type: string, severity: string, ip: string, userAgent: string, endpoint: string, details: any) {
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

// =============================================
// MAIN MIDDLEWARE FUNCTION
// =============================================
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  const now = Date.now();
  const origin = request.nextUrl.origin;

  // Load dynamic rules
  const rules = await loadDynamicRules();

  // =============================================
  // RULE 4: Admin Access Protection
  // =============================================
  const adminToken = request.cookies.get('admin_token')?.value;
  const userToken = request.cookies.get('user_token')?.value;
  const isAdminLogin = pathname === '/admin/login';
  const adminProtectionEnabled = await isRuleEnabled('admin_protection');

  if (adminProtectionEnabled && pathname.startsWith('/admin') && !isAdminLogin) {
    if (!adminToken) {
      await logIncident(origin, 'unauthorized_admin_access', 'high', ip, userAgent, pathname, {
        attempted_access: pathname,
        missing_token: true,
      });
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Account protection
  if (pathname.startsWith('/account')) {
    if (!userToken) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // =============================================
  // RULE 8: Auto-Block Check (IP already blocked)
  // =============================================
  if (rules.autoBlock.enabled) {
    const blockedKey = `blocked:${ip}`;
    const blockedData = rateLimitStore.get(blockedKey);
    if (blockedData && now < blockedData.resetTime) {
      return NextResponse.json(
        { error: 'Too many suspicious requests. Please try again later.' },
        { status: 403 }
      );
    }
  }

  // Skip protection for static assets and certain paths
  const skipProtectionPaths = ['/_next/', '/favicon.ico', '/api/track-session', '/api/security/log-incident', '/api/auth/captcha'];
  const shouldSkipProtection = skipProtectionPaths.some(path => pathname.includes(path));
  
  if (!shouldSkipProtection && !pathname.startsWith('/admin')) {
    
    // =============================================
    // RULE 2: Rate Limiting
    // =============================================
    if (rules.rateLimiting.enabled) {
      const rateKey = `rate:${ip}`;
      const rateData = rateLimitStore.get(rateKey);
      
      if (rateData && now < rateData.resetTime) {
        if (rateData.count >= rules.rateLimiting.maxRequests) {
          await logIncident(origin, 'rate_limit_exceeded', 'medium', ip, userAgent, pathname, {
            count: rateData.count,
            limit: rules.rateLimiting.maxRequests,
          });
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please slow down.' },
            { status: 429 }
          );
        }
        rateData.count++;
        rateLimitStore.set(rateKey, rateData);
      } else {
        rateLimitStore.set(rateKey, {
          count: 1,
          resetTime: now + rules.rateLimiting.windowMs,
        });
      }
    }

    // =============================================
    // RULE 3: Suspicious Activity / Bot Detection
    // =============================================
    if (rules.suspiciousActivity.enabled) {
      const suspiciousKey = `suspicious:${ip}`;
      const suspiciousData = suspiciousActivityStore.get(suspiciousKey);
      
      if (suspiciousData && now < suspiciousData.firstActivity + rules.suspiciousActivity.windowMs) {
        const newCount = suspiciousData.count + 1;
        if (newCount >= rules.suspiciousActivity.maxRequests) {
          // Auto-block
          if (rules.autoBlock.enabled) {
            rateLimitStore.set(`blocked:${ip}`, {
              count: 1,
              resetTime: now + rules.autoBlock.blockDurationMs,
            });
          }
          
          await logIncident(origin, 'bot_detected', 'high', ip, userAgent, pathname, {
            request_count: newCount,
            time_window_ms: rules.suspiciousActivity.windowMs,
            reason: 'rapid_requests',
          });
          
          return NextResponse.json(
            { error: 'Suspicious activity detected. Access blocked.' },
            { status: 403 }
          );
        }
        suspiciousActivityStore.set(suspiciousKey, { count: newCount, firstActivity: suspiciousData.firstActivity });
      } else {
        suspiciousActivityStore.set(suspiciousKey, { count: 1, firstActivity: now });
      }
    }

    // =============================================
    // RULE 7: Bot Detection (Missing headers)
    // =============================================
    const botDetectionEnabled = await isRuleEnabled('bot_detection');
    if (botDetectionEnabled) {
      const isBot = !userAgent || 
                    userAgent.toLowerCase().includes('bot') || 
                    userAgent.toLowerCase().includes('crawl') ||
                    userAgent.toLowerCase().includes('scrape') ||
                    userAgent.toLowerCase().includes('python') ||
                    userAgent.toLowerCase().includes('curl') ||
                    userAgent.toLowerCase().includes('wget') ||
                    !request.headers.get('accept') ||
                    !request.headers.get('accept-language');
      
      if (isBot && !pathname.includes('/api/')) {
        await logIncident(origin, 'bot_detected', 'medium', ip, userAgent, pathname, {
          reason: 'missing_headers_or_bot_user_agent',
          user_agent: userAgent,
        });
      }
    }

    // =============================================
    // RULE 6: Checkout Protection
    // =============================================
    if (rules.checkoutProtection.enabled && (pathname.includes('/checkout') || pathname.includes('/api/checkout'))) {
      const checkoutKey = `checkout:${ip}`;
      const checkoutData = checkoutStore.get(checkoutKey);
      
      if (checkoutData && now < checkoutData.resetTime) {
        if (checkoutData.count >= rules.checkoutProtection.maxAttempts) {
          await logIncident(origin, 'checkout_abuse', 'high', ip, userAgent, pathname, {
            attempts: checkoutData.count,
            limit: rules.checkoutProtection.maxAttempts,
          });
          return NextResponse.json(
            { error: 'Too many checkout attempts. Please try again later.' },
            { status: 429 }
          );
        }
        checkoutData.count++;
        checkoutStore.set(checkoutKey, checkoutData);
      } else {
        checkoutStore.set(checkoutKey, {
          count: 1,
          resetTime: now + rules.checkoutProtection.windowMs,
        });
      }
    }
  }

  // =============================================
  // SESSION TRACKING (Existing functionality)
  // =============================================
  const response = NextResponse.next();
  
  const skipTrackingPaths = [
    '/api/', '/_next/', '/favicon.ico', 
    '/admin/', '/admin/login', '/auth/login', '/auth/register',
    '/login', '/register'
  ];
  
  const shouldSkipTracking = skipTrackingPaths.some(path => pathname.startsWith(path));
  
  if (!shouldSkipTracking) {
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
      } catch (err) {
        console.error('Failed to decode user token:', err);
      }
    }
    
    const trackingData = {
      sessionId,
      userId,
      pageUrl: pathname,
      userAgent: userAgent,
      ipAddress: ip,
      referrer: request.headers.get('referer') || '',
    };
    
    fetch(`${origin}/api/track-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackingData),
    }).catch(err => console.error('Session tracking failed:', err));
  }

  // Add security headers to response
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

// =============================================
// EXPORT CONFIG
// =============================================
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
