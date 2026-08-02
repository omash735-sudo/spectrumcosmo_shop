// app/api/subscribe/count/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const sql = getDb();
    const [result] = await sql`
      SELECT COUNT(*) as count FROM subscribers WHERE status = 'confirmed'
    `;
    
    return NextResponse.json({ 
      count: Number(result?.count) || 0 
    });
  } catch (err) {
    console.error('Failed to get subscriber count:', err);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
