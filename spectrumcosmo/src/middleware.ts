export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith('/api/admin/') || pathname.startsWith('/admin');
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

function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  const adminToken = request.cookies.get('admin_token')?.value;
  const userToken = request.cookies.get('user_token')?.value;

  if (isAdminRoute(pathname)) {
    const isLoginPage = pathname === '/admin/login';
    const isAuthApi = pathname === '/api/admin/auth';
    const isAsset = isPublicAsset(pathname);

    if (!isLoginPage && !isAuthApi && !isAsset && !adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (isAsset) return response;
  }

  if (pathname.startsWith('/account') || pathname.startsWith('/checkout')) {
    if (isPublicAsset(pathname)) return response;

    if (!userToken || !verifyToken(userToken)) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.cloudinary.com https://vercel.live https://va.vercel-scripts.com https:",
    "frame-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);

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
    '/events/:path*',
    '/api/:path*',
  ],
};
