// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Get all cookies and delete them
    const allCookies = cookieStore.getAll();
    for (const cookie of allCookies) {
      if (cookie.name === 'user_token' || cookie.name === 'admin_token') {
        cookieStore.delete(cookie.name);
      }
    }
    
    const res = NextResponse.json({ success: true, message: 'Logged out successfully' });
    
    // Delete cookies with explicit settings
    res.cookies.delete('user_token');
    res.cookies.delete('admin_token');
    
    // Force clear by setting expired
    res.cookies.set('user_token', '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    });
    res.cookies.set('admin_token', '', {
      expires: new Date(0),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    });
    
    // Also set a no-cache header to prevent caching
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
    
    return res;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Logout failed' 
    }, { status: 500 });
  }
}
