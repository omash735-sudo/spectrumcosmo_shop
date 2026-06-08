// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getRedisClient, isRateLimited, isIpBlocked, blockIp } from '@/lib/security/redis-client';
import { getRule } from '@/lib/security/rules';
import { isWhitelisted } from '@/lib/security/whitelist';
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

// Generate a cryptographically secure nonce for CSP
function generateNonce(): string {
  const buffer = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...buffer));
}

export async function middleware(request: NextRequest) {
  const nonce = generateNonce();
  const response = NextResponse.next();

  // Set CSP header with the nonce (must be done on the response object before any other modifications)
  const csp = [
    "default-src 'self'",
    `script-src 'self' https://vercel.live https://vercel.com 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://res.cloudinary.com",
    "connect-src 'self' https://api.upstash.com https://api.cloudinary.com",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);

  // Also add other security headers (already done in setSecurityHeaders, but we call it later)
  // We'll override the CSP header that setSecurityHeaders might set, so we need to ensure our CSP is applied.
  // We'll call setSecurityHeaders first or after? We'll reorder: set our CSP, then call setSecurityHeaders (if it doesn't overwrite).
  // Alternatively, integrate the CSP inside setSecurityHeaders and pass the nonce. For simplicity, we'll apply all headers here and not rely on setSecurityHeaders for CSP.
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  const method = request.method;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  // Blacklisted token check
  const userToken = request.cookies.get('user_token')?.value;
  if (userToken && await isTokenBlacklisted(userToken)) {
    const redirectResponse = NextResponse.redirect(new URL('/auth/login', request.url));
    redirectResponse.cookies.delete('user_token');
    // Copy over security headers
    redirectResponse.headers.set('Content-Security-Policy', csp);
    redirectResponse.headers.set('X-Content-Type-Options', 'nosniff');
    redirectResponse.headers.set('X-Frame-Options', 'DENY');
    redirectResponse.headers.set('X-XSS-Protection', '1; mode=block');
    redirectResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    redirectResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
    return redirectResponse;
  }

  // Whitelist check
  if (isWhitelisted(ip)) {
    return response;
  }

  // Admin routes - skip detailed security but protect access
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

  // Test account write blocking
  if (WRITE_METHODS.includes(method) && await isTestAccountWriteBlocked(request)) {
    const blockResponse = NextResponse.json(
      { error: 'Test account is currently in read-only mode. Write actions are disabled.' },
      { status: 403 }
    );
    blockResponse.headers.set('Content-Security-Policy', csp);
    return blockResponse;
  }

  // Full security checks for protected routes
  const shouldSkip = shouldSkipSecurity(pathname);

  if (!shouldSkip) {
    // IP block check
    if (await isIpBlocked(ip)) {
      const blockResponse = NextResponse.json(
        { error: 'Your IP has been blocked due to suspicious activity. Please contact support.' },
        { status: 403 }
      );
      blockResponse.headers.set('Content-Security-Policy', csp);
      return blockResponse;
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
        const limitResponse = NextResponse.json({ error: 'Rate limit exceeded. Please slow down.' }, { status: 429 });
        limitResponse.headers.set('Content-Security-Policy', csp);
        return limitResponse;
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
        const suspiciousResponse = NextResponse.json({ error: 'Suspicious activity detected. Access blocked.' }, { status: 403 });
        suspiciousResponse.headers.set('Content-Security-Policy', csp);
        return suspiciousResponse;
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
          const abuseResponse = NextResponse.json({ error: 'Too many checkout attempts. Please try again later.' }, { status: 429 });
          abuseResponse.headers.set('Content-Security-Policy', csp);
          return abuseResponse;
        }
      }
    }
  }

  // Account page protection
  if (pathname.startsWith('/account') && !userToken) {
    const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
    redirectResponse.headers.set('Content-Security-Policy', csp);
    return redirectResponse;
  }

  // Apply other security headers (already applied in the initial response)
  // We already set them at the beginning, so just return the response.
  return response;
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
