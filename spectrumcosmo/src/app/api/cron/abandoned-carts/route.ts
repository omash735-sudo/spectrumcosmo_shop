import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // seconds (for larger stores)

export async function GET() {
  try {
    const sql = getDb();
    
    // Mark carts as abandoned where last_activity > 1 hour ago and status = 'active'
    const result = await sql`
      UPDATE cart_sessions
      SET status = 'abandoned'
      WHERE status = 'active' 
        AND last_activity < NOW() - INTERVAL '1 hour'
      RETURNING session_id
    `;
    
    const abandonedCount = result.length;
    console.log(`Marked ${abandonedCount} carts as abandoned`);
    
    return NextResponse.json({ 
      success: true, 
      abandonedCount,
      message: `Marked ${abandonedCount} abandoned carts`
    });
  } catch (err) {
    console.error('Failed to mark abandoned carts:', err);
    return NextResponse.json({ error: 'Failed to process abandoned carts' }, { status: 500 });
  }
}
