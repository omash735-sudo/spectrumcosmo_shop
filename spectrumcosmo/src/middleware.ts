import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SKIP_SECURITY_PATHS = [
  '/_next/',
  '/favicon.ico',
  '/api/security/',
  '/api/log-request',
  '/api/cron/',
  '/api/csrf',
];

function shouldSkipSecurity(pathname: string): boolean {
  return SKIP_SECURITY_PATHS.some(path => pathname.includes(path));
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/api/admin/') || pathname.startsWith('/admin');
}

function isAdminApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/admin/');
}

function isPublicAsset(pathname: string): boolean {
  return pathname.startsWith('/_next/') ||
    pathname.includes('favicon') ||
    pathname.includes('.ico') ||
    pathname.includes('.png') ||
    pathname.includes('.jpg') ||
    pathname.includes('.svg') ||
    pathname.includes('.webp');
}

function generateNonce(): string {
  const buffer = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...buffer));
}

export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next();
    const { pathname } = request.nextUrl;

    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

    const userToken = request.cookies.get('user_token')?.value;

    if (isAdminRoute(pathname)) {
      const adminToken = request.cookies.get('admin_token')?.value;
      const isLoginPage = pathname === '/admin/login';
      const isAuthApi = pathname === '/api/admin/auth';
      const isAsset = isPublicAsset(pathname);
      const isApiRoute = pathname.startsWith('/api/admin/');

      if (!isLoginPage && !isAuthApi && !isAsset && !isApiRoute) {
        if (!adminToken) {
          return NextResponse.redirect(new URL('/admin/login', request.url));
        }
      }
      return response;
    }

    if (pathname.startsWith('/account') && !userToken) {
      if (isPublicAsset(pathname)) {
        return response;
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const nonce = generateNonce();
    const csp = `
      default-src 'self';
      script-src 'self' 'nonce-${nonce}' https://vercel.live https://va.vercel-scripts.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' https://vercel.live https://va.vercel-scripts.com;
      frame-src 'self';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s+/g, ' ').trim();

    response.headers.set('Content-Security-Policy', csp);

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/account/:path*',
    '/products/:path*',
    '/product/:path*',
    '/reviews/:path*',
    '/checkout/:path*',
    '/events/:path*',
    '/api/:path*',
  ],
};
