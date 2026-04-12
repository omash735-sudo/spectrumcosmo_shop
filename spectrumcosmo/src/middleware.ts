import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const adminToken = req.cookies.get('admin_token')?.value
  const userToken = req.cookies.get('user_token')?.value

  // Protect admin routes (ONLY check existence)
  if (pathname.startsWith('/admin')) {
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  // Protect user account routes (ONLY check existence)
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
