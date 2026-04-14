import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const adminToken = req.cookies.get('admin_token')?.value
  const userToken = req.cookies.get('user_token')?.value

  // Exclude login page from protection
  const isAdminLogin = pathname === '/admin/login'

  if (pathname.startsWith('/admin') && !isAdminLogin) {
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  if (pathname.startsWith('/account')) {
    if (!userToken) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*']
    }
