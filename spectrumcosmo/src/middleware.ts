import { NextRequest, NextResponse } from 'next/server'
import { verifyUserToken, verifyToken } from '@/lib/auth'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = req.cookies.get('admin_token')?.value
    console.log('MIDDLEWARE - token:', token ? 'EXISTS' : 'MISSING')
    console.log('MIDDLEWARE - verify:', token ? verifyToken(token) : 'NO TOKEN')
  }

  // ✅ Allow public admin login route
  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next()
  }

  // ✅ Allow public user login route
  if (pathname.startsWith('/auth/login')) {
    return NextResponse.next()
  }

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
