// app/api/newsletter/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const sql = getDb();

  // Use queryAsArray to get a real array with .length
  const results = await queryAsArray<{ email: string }>`
    UPDATE subscribers
    SET status = 'confirmed', confirmed_at = NOW()
    WHERE token = ${token} AND status = 'pending'
    RETURNING email
  `;

  if (results.length === 0) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spectrumcosmo.com';
  return NextResponse.redirect(`${appUrl}/newsletter?confirmed=true`);
}
