import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const sql = getDb();
  const methods = await sql`SELECT * FROM delivery_methods WHERE is_active = true ORDER BY sort_order`;
  return NextResponse.json(methods);
}
