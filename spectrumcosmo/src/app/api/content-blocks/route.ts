import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const revalidate = 60; // ISR cache for 60 seconds

export async function GET() {
  try {
    const sql = getDb();
    const blocks = await sql`
      SELECT * FROM content_blocks
      WHERE is_active = true
      ORDER BY display_order ASC
    `;
    return NextResponse.json(blocks);
  } catch (err) {
    console.error('Failed to fetch content blocks:', err);
    return NextResponse.json([]);
  }
}
