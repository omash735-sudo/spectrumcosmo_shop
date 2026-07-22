// app/api/debug-env/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'missing',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'set' : 'missing',
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID ? 'set' : 'missing',
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET ? 'set' : 'missing',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
  });
}
