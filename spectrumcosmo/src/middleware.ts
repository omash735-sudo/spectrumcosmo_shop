// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

function generateNonce(): string {
  const buffer = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...buffer));
}

export async function middleware(request: NextRequest) {
  try {
    // Dynamically import security modules so that any import error is caught
    const { getRedisClient, isRateLimited, isIpBlocked, blockIp } = await import('@/lib/security/redis-client');
    const { getRule } = await import('@/lib/security/rules');
    const { isWhitelisted } = await import('@/lib/security/whitelist');
    const { isTestAccountWriteBlocked } = await import('@/lib/security/test-account');

    const nonce = generateNonce();
    const response = NextResponse.next();

    const { pathname } = request.nextUrl;
    
    // Choose CSP based on route (permissive for admin)
    let csp: string;
    if (isAdminRoute(pathname)) {
      // Permissive CSP for admin panel (allows all inline scripts & styles)
      csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://res.cloudinary.com; connect-src 'self' https://api.upstash.com https://api.cloudinary.com;";
    } else {
      // Strict CSP for public pages (with unsafe-inline added for compatibility)
      csp = [
        "default-src 'self'",
        `script-src 'self' https://vercel.live https://vercel.com 'unsafe-inline' 'nonce-${nonce}'`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https://res.cloudinary.com",
        "connect-src 'self' https://api.upstash.com https://api.cloudinary.com",
        "frame-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ');
    }

    response.headers.set('Content-Security-Policy', csp);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';
    const method = request.method;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

    // Token blacklist check
    const userToken = request.cookies.get('user_token')?.value;
    if (userToken) {
      const isBlacklisted = await isTokenBlacklisted(userToken, getRedisClient);
      if (isBlacklisted) {
        const redirectResponse = NextResponse.redirect(new URL('/auth/login', request.url));
        redirectResponse.cookies.delete('user_token');
        copySecurityHeaders(redirectResponse, csp);
        return redirectResponse;
      }
    }

    if (await isWhitelisted(ip)) {
      return response;
    }

    if (isAdminRoute(pathname)) {
      const adminToken = request.cookies.get('admin_token')?.value;
      const isLoginPage = pathname === '/admin/login';
      const isAuthApi = pathname === '/api/admin/auth';
      const isAsset = isPublicAsset(pathname);
      if (!isLoginPage && !isAuthApi && !isAsset && !adminToken) {
        if (pathname.startsWith('/api/')) {
          const apiResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          apiResponse.headers.set('Content-Security-Policy', csp);
          return apiResponse;
        }
        const redirectResponse = NextResponse.redirect(new URL('/admin/login', request.url));
        redirectResponse.headers.set('Content-Security-Policy', csp);
        return redirectResponse;
      }
      return response;
    }

    if (WRITE_METHODS.includes(method) && await isTestAccountWriteBlocked(request)) {
      const blockResponse = NextResponse.json(
        { error: 'Test account is currently in read-only mode. Write actions are disabled.' },
        { status: 403 }
      );
      blockResponse.headers.set('Content-Security-Policy', csp);
      return blockResponse;
    }

    const shouldSkip = shouldSkipSecurity(pathname);
    if (!shouldSkip) {
      if (await isIpBlocked(ip)) {
        const blockResponse = NextResponse.json(
          { error: 'Your IP has been blocked due to suspicious activity. Please contact support.' },
          { status: 403 }
        );
        blockResponse.headers.set('Content-Security-Policy', csp);
        return blockResponse;
      }

      let rateRule = null;
      try {
        rateRule = await getRule('rate_limiting');
      } catch {}
      if (rateRule?.enabled) {
        const rateKey = `rate:${ip}`;
        const isLimited = await isRateLimited(rateKey, rateRule.max_requests || 60, rateRule.window_seconds || 60);
        if (isLimited) {
          await logSecurityEvent(baseUrl, { type: 'rate_limit_exceeded', severity: 'medium', ip, userAgent, endpoint: pathname });
          const limitResponse = NextResponse.json({ error: 'Rate limit exceeded. Please slow down.' }, { status: 429 });
          limitResponse.headers.set('Content-Security-Policy', csp);
          return limitResponse;
        }
      }

      let suspiciousRule = null;
      try {
        suspiciousRule = await getRule('suspicious_activity');
      } catch {}
      if (suspiciousRule?.enabled) {
        const suspiciousKey = `suspicious:${ip}`;
        const isSuspicious = await isRateLimited(suspiciousKey, suspiciousRule.max_requests || 20, suspiciousRule.window_seconds || 10);
        if (isSuspicious) {
          const autoBlockRule = await getRule('auto_block');
          if (autoBlockRule?.enabled) {
            await blockIp(ip, (suspiciousRule.block_minutes || 30) * 60);
          }
          await logSecurityEvent(baseUrl, { type: 'bot_detected', severity: 'high', ip, userAgent, endpoint: pathname });
          const suspiciousResponse = NextResponse.json({ error: 'Suspicious activity detected. Access blocked.' }, { status: 403 });
          suspiciousResponse.headers.set('Content-Security-Policy', csp);
          return suspiciousResponse;
        }
      }

      if (pathname.includes('/checkout')) {
        let checkoutRule = null;
        try {
          checkoutRule = await getRule('checkout_protection');
        } catch {}
        if (checkoutRule?.enabled) {
          const checkoutKey = `checkout:${ip}`;
          const windowSeconds = (checkoutRule.window_hours || 1) * 60 * 60;
          const isAbusing = await isRateLimited(checkoutKey, checkoutRule.max_attempts || 10, windowSeconds);
          if (isAbusing) {
            await logSecurityEvent(baseUrl, { type: 'checkout_abuse', severity: 'high', ip, userAgent, endpoint: pathname });
            const abuseResponse = NextResponse.json({ error: 'Too many checkout attempts. Please try again later.' }, { status: 429 });
            abuseResponse.headers.set('Content-Security-Policy', csp);
            return abuseResponse;
          }
        }
      }
    }

    if (pathname.startsWith('/account') && !userToken) {
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
      redirectResponse.headers.set('Content-Security-Policy', csp);
      return redirectResponse;
    }

    return response;
  } catch (error) {
    console.error('Middleware fatal error (fallback activated):', error);
    const fallbackResponse = NextResponse.next();
    const nonce = generateNonce();
    fallbackResponse.headers.set('Content-Security-Policy', `default-src 'self'; script-src 'self' 'unsafe-inline' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline';`);
    return fallbackResponse;
  }
}

// Helper to copy headers (to avoid duplication)
function copySecurityHeaders(response: NextResponse, csp: string) {
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
}

// Small helper to check token blacklist (avoid duplicate code)
async function isTokenBlacklisted(token: string, getRedisClient: any): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const blacklisted = await redis.get(`blacklist:${token}`);
    return blacklisted !== null;
  } catch {
    return false;
  }
}

async function logSecurityEvent(baseUrl: string, payload: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`${baseUrl}/api/security/log-incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {}
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
