import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Remove caching temporarily
// export const revalidate = 60;  // COMMENT THIS OUT

export const dynamic = 'force-dynamic'; // ADD THIS

export async function GET() {
  try {
    const sql = getDb();
    const slides = await sql`
      SELECT * FROM hero_slides
      WHERE is_active = true
      ORDER BY display_order ASC
    `;
    console.log('Public API - slides found:', slides.length);
    return NextResponse.json(slides);
  } catch (err) {
    console.error('Failed to fetch hero slides:', err);
    return NextResponse.json([]);
  }
}
