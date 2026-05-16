import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST() {
  try {
    const sql = getDb();
    
    // Mark sessions as exited after 15 minutes of inactivity
    await sql`
      UPDATE user_sessions 
      SET exited_at = CURRENT_TIMESTAMP
      WHERE visited_at < NOW() - INTERVAL '15 minutes'
        AND exited_at IS NULL
    `;
    
    // Delete old cart sessions
    await sql`
      UPDATE cart_sessions 
      SET status = 'abandoned', abandoned_at = CURRENT_TIMESTAMP
      WHERE last_activity < NOW() - INTERVAL '24 hours'
        AND status = 'active'
    `;
    
    return NextResponse.json({ success: true, message: 'Sessions cleaned up' });
  } catch (err) {
    console.error('Cleanup error:', err);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
