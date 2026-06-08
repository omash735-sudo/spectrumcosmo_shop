import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getDb();
    
    // Get ALL slides (including inactive ones)
    const allSlides = await sql`
      SELECT id, title, is_active, display_order, image_url 
      FROM hero_slides
      ORDER BY display_order ASC
    `;
    
    // Get count of active slides
    const activeCount = await sql`
      SELECT COUNT(*) as count FROM hero_slides WHERE is_active = true
    `;
    
    return NextResponse.json({
      totalSlides: allSlides.length,
      activeSlides: parseInt(activeCount[0]?.count || '0'),
      slides: allSlides,
      message: allSlides.length === 0 ? 'No slides found at all in database' : 'Slides exist but may be inactive'
    });
    
  } catch (err) {
    console.error('Debug failed:', err);
    return NextResponse.json({ 
      error: 'Failed to debug',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
