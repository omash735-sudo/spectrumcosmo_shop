// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('user_token');

  const res = NextResponse.json({ success: true });
  res.cookies.delete('user_token');
  
  return res;
}
