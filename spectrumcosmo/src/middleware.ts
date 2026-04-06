import { NextRequest, NextResponse } from 'next/server'
import { verifyUserToken, verifyToken } from '@/lib/auth'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Protect customer routes
  if (pathname.startsWith('/account')) {
    const token = req.cookies.get('user_token')?.value
    if (!token || !verifyUserToken(token)) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('admin_token')?.value
    if (!token || !verifyToken(token)) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*']
}
