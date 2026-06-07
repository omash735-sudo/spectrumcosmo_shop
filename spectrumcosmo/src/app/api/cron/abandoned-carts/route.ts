// app/api/cron/abandoned-carts/route.ts
import { NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // seconds (for larger stores)

export async function GET() {
  try {
    const sql = getDb();

    // Mark carts as abandoned where last_activity > 1 hour ago and status = 'active'
    const updated = await queryAsArray<{ session_id: string }>`
      UPDATE cart_sessions
      SET status = 'abandoned'
      WHERE status = 'active' 
        AND last_activity < NOW() - INTERVAL '1 hour'
      RETURNING session_id
    `;

    const abandonedCount = updated.length;
    console.log(`Marked ${abandonedCount} carts as abandoned`);

    return NextResponse.json({
      success: true,
      abandonedCount,
      message: `Marked ${abandonedCount} abandoned carts`,
    });
  } catch (err) {
    console.error('Failed to mark abandoned carts:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
