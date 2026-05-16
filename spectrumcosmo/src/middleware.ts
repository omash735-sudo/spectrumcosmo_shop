import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // =============================================
  // EXISTING: Admin & Account Protection
  // =============================================
  const adminToken = request.cookies.get('admin_token')?.value;
  const userToken = request.cookies.get('user_token')?.value;

  const isAdminLogin = pathname === '/admin/login';

  if (pathname.startsWith('/admin') && !isAdminLogin) {
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  if (pathname.startsWith('/account')) {
    if (!userToken) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // =============================================
  // NEW: Session Tracking for Active Users
  // =============================================
  const response = NextResponse.next();
  
  // Skip tracking for admin, API, static files, and auth pages
  const skipPaths = [
    '/api/', '/_next/', '/favicon.ico', 
    '/admin/', '/admin/login', '/auth/login', '/auth/register',
    '/login', '/register'
  ];
  
  const shouldSkip = skipPaths.some(path => pathname.startsWith(path));
  
  if (!shouldSkip) {
    // Get or create session ID from cookie
    let sessionId = request.cookies.get('user_session_id')?.value;
    
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      response.cookies.set('user_session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        sameSite: 'lax',
      });
    }
    
    // Get user ID from your existing user_token (if logged in)
    let userId = null;
    if (userToken) {
      try {
        // Decode your JWT token - adjust based on your token structure
        const decoded = JSON.parse(Buffer.from(userToken.split('.')[1], 'base64').toString());
        userId = decoded.userId || decoded.id || null;
      } catch (err) {
        console.error('Failed to decode user token:', err);
      }
    }
    
    // Fire-and-forget API call to track session (don't await)
    const trackingData = {
      sessionId,
      userId,
      pageUrl: pathname,
      userAgent: request.headers.get('user-agent') || '',
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
      referrer: request.headers.get('referer') || '',
    };
    
    // Send tracking async (don't block the response)
    const url = request.nextUrl.clone();
    fetch(`${url.origin}/api/track-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackingData),
    }).catch(err => console.error('Session tracking failed:', err));
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*', 
    '/account/:path*',
    // Add public routes to track
    '/',
    '/products/:path*',
    '/product/:path*',
    '/reviews/:path*',
    '/about',
    '/contact',
    '/newsletter',
  ],
};
