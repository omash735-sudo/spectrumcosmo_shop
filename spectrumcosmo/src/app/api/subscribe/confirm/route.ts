import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const sql = getDb();
  const result = await sql`
    UPDATE subscribers
    SET status = 'confirmed', confirmed_at = NOW()
    WHERE token = ${token} AND status = 'pending'
    RETURNING email
  `;
  if (result.length === 0) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }
  // Redirect to a thank‑you page
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/newsletter?confirmed=true`);
}
