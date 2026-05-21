import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const revalidate = 60; // ISR cache for 60 seconds

export async function GET() {
  try {
    const sql = getDb();
    const slides = await sql`
      SELECT * FROM hero_slides
      WHERE is_active = true
      ORDER BY display_order ASC
    `;
    return NextResponse.json(slides);
  } catch (err) {
    console.error('Failed to fetch hero slides:', err);
    return NextResponse.json([]);
  }
}
