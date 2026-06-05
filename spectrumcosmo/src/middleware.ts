// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRedisClient, isRateLimited, isIpBlocked, blockIp } from '@/lib/security/redis-client';
import { getRule } from '@/lib/security/rules';
import { isWhitelisted } from '@/lib/security/whitelist';
import { setSecurityHeaders } from '@/lib/security/headers';
import { isTestAccountWriteBlocked } from '@/lib/security/test-account';

const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const SKIP_SECURITY_PATHS = ['/_next/', '/favicon.ico', '/api/security/', '/api/log-request', '/api/cron/'];

function shouldSkipSecurity(pathname: string): boolean {
  return SKIP_SECURITY_PATHS.some(path => pathname.includes(path));
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/api/admin/') || pathname.startsWith('/admin');
}

function isPublicAsset(pathname: string): boolean {
  return pathname.startsWith('/_next/') || pathname.includes('favicon') || pathname.includes('.ico');
}

async function isTokenBlacklisted(token: string): Promise<boolean> {
  const redis = getRedisClient();
  const blacklisted = await redis.get(`blacklist:${token}`);
  return blacklisted !== null;
}

async function logSecurityEvent(baseUrl: string, payload: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`${baseUrl}/api/security/log-incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {
    // Silent failure - don't block request
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  const method = request.method;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  
  // Blacklisted token check
  const userToken = request.cookies.get('user_token')?.value;
  if (userToken && await isTokenBlacklisted(userToken)) {
    const response = NextResponse.redirect(new URL('/auth/login', request.url));
    response.cookies.delete('user_token');
    return setSecurityHeaders(response);
  }
  
  // Whitelist check
  if (isWhitelisted(ip)) {
    return setSecurityHeaders(NextResponse.next());
  }
  
  // Admin routes - skip detailed security but protect access
  if (isAdminRoute(pathname)) {
    const adminToken = request.cookies.get('admin_token')?.value;
    const isLoginPage = pathname === '/admin/login';
    const isAuthApi = pathname === '/api/admin/auth';
    const isAsset = isPublicAsset(pathname);
    
    if (!isLoginPage && !isAuthApi && !isAsset && !adminToken) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    return setSecurityHeaders(NextResponse.next());
  }
  
  // Test account write blocking
  if (WRITE_METHODS.includes(method) && await isTestAccountWriteBlocked(request)) {
    return NextResponse.json(
      { error: 'Test account is currently in read-only mode. Write actions are disabled.' },
      { status: 403 }
    );
  }
  
  // Full security checks for protected routes
  const shouldSkip = shouldSkipSecurity(pathname);
  
  if (!shouldSkip) {
    // IP block check
    if (await isIpBlocked(ip)) {
      return NextResponse.json(
        { error: 'Your IP has been blocked due to suspicious activity. Please contact support.' },
        { status: 403 }
      );
    }
    
    // Rate limiting
    const rateRule = await getRule('rate_limiting');
    if (rateRule.enabled) {
      const rateKey = `rate:${ip}`;
      const isLimited = await isRateLimited(rateKey, rateRule.max_requests || 60, rateRule.window_seconds || 60);
      
      if (isLimited) {
        await logSecurityEvent(baseUrl, {
          type: 'rate_limit_exceeded',
          severity: 'medium',
          ip,
          userAgent,
          endpoint: pathname,
        });
        return NextResponse.json({ error: 'Rate limit exceeded. Please slow down.' }, { status: 429 });
      }
    }
    
    // Suspicious activity detection
    const suspiciousRule = await getRule('suspicious_activity');
    if (suspiciousRule.enabled) {
      const suspiciousKey = `suspicious:${ip}`;
      const isSuspicious = await isRateLimited(suspiciousKey, suspiciousRule.max_requests || 20, suspiciousRule.window_seconds || 10);
      
      if (isSuspicious) {
        const autoBlockRule = await getRule('auto_block');
        if (autoBlockRule.enabled) {
          await blockIp(ip, (suspiciousRule.block_minutes || 30) * 60);
        }
        await logSecurityEvent(baseUrl, {
          type: 'bot_detected',
          severity: 'high',
          ip,
          userAgent,
          endpoint: pathname,
        });
        return NextResponse.json({ error: 'Suspicious activity detected. Access blocked.' }, { status: 403 });
      }
    }
    
    // Checkout protection
    if (pathname.includes('/checkout')) {
      const checkoutRule = await getRule('checkout_protection');
      if (checkoutRule.enabled) {
        const checkoutKey = `checkout:${ip}`;
        const windowSeconds = (checkoutRule.window_hours || 1) * 60 * 60;
        const isAbusing = await isRateLimited(checkoutKey, checkoutRule.max_attempts || 10, windowSeconds);
        
        if (isAbusing) {
          await logSecurityEvent(baseUrl, {
            type: 'checkout_abuse',
            severity: 'high',
            ip,
            userAgent,
            endpoint: pathname,
          });
          return NextResponse.json({ error: 'Too many checkout attempts. Please try again later.' }, { status: 429 });
        }
      }
    }
  }
  
  // Account page protection
  if (pathname.startsWith('/account') && !userToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  const response = NextResponse.next();
  return setSecurityHeaders(response);
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/account/:path*',
    '/products/:path*',
    '/product/:path*',
    '/reviews/:path*',
    '/checkout/:path*',
    '/api/:path*',
  ],
};
