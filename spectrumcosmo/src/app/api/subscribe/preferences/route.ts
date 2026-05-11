import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { email, preferences } = await req.json();
  if (!email || !preferences) return NextResponse.json({ error: 'Invalid' }, { status: 400 });
  const sql = getDb();
  await sql`
    UPDATE subscribers SET preferences = ${JSON.stringify(preferences)}
    WHERE email = ${email}
  `;
  return NextResponse.json({ success: true });
}
