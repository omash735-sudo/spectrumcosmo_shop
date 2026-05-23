import { NextRequest, NextResponse } from 'next/server';

const CSRF_SECRET = process.env.JWT_SECRET || 'csrf-secret-change-me';

export function generateCsrfToken(userId?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const data = `${userId || 'guest'}:${timestamp}:${random}`;
  // Simple hash - in production use crypto
  return Buffer.from(data).toString('base64');
}

export function setCsrfToken(response: NextResponse, userId?: string): NextResponse {
  const token = generateCsrfToken(userId);
  response.cookies.set('csrf_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
  return response;
}

export function verifyCsrfToken(request: NextRequest): boolean {
  const tokenFromCookie = request.cookies.get('csrf_token')?.value;
  const tokenFromHeader = request.headers.get('x-csrf-token');
  
  if (!tokenFromCookie || !tokenFromHeader) return false;
  if (tokenFromCookie !== tokenFromHeader) return false;
  
  return true;
}

export function requireCsrf(handler: Function) {
  return async (req: NextRequest) => {
    if (!verifyCsrfToken(req)) {
      return NextResponse.json({ error: 'CSRF token missing or invalid' }, { status: 403 });
    }
    return handler(req);
  };
}
