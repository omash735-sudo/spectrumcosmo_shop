// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  cookieStore.delete('user_token');
  cookieStore.delete('admin_token');
  
  const res = NextResponse.json({ success: true });
  
  res.cookies.delete('user_token');
  res.cookies.delete('admin_token');
  
  res.cookies.set('user_token', '', {
    expires: new Date(0),
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.cookies.set('admin_token', '', {
    expires: new Date(0),
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return res;
}
