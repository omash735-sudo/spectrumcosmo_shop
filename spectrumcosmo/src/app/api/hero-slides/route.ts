import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const revalidate = 60;

export async function GET() {
  try {
    const sql = getDb();
    
    // Use the EXACT same query as your admin API
    const slides = await sql`
      SELECT 
        id, 
        image_url, 
        title, 
        description, 
        button_text, 
        button_link, 
        autoplay_delay,
        display_order,
        is_active
      FROM hero_slides
      WHERE is_active = true
      ORDER BY display_order ASC
    `;
    
    console.log('Public API found slides:', slides.length);
    
    return NextResponse.json(slides);
  } catch (err) {
    console.error('Failed to fetch hero slides:', err);
    return NextResponse.json([]);
  }
}
