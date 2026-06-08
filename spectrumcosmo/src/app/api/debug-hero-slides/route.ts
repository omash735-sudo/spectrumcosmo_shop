import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: any = {};
  
  try {
    const sql = getDb();
    
    // Step 1: Check if table exists and what columns it has
    try {
      const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'hero_slides'
        ORDER BY ordinal_position
      `;
      results.columns = columns;
    } catch (err: any) {
      results.columnsError = err.message;
    }
    
    // Step 2: Try inserting one slide at a time to find which fails
    const testSlide = {
      image_url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1778101210/pc97xdh08ivrbtvdzins.jpg',
      title: 'Test Slide',
      description: 'This is a test',
      button_text: 'Shop Now',
      button_link: '/products',
      is_active: true,
      display_order: 1,
      autoplay_delay: 5000
    };
    
    try {
      // Try simplified insert (only required fields)
      await sql`
        INSERT INTO hero_slides (image_url, title, is_active, display_order)
        VALUES (${testSlide.image_url}, ${testSlide.title}, ${testSlide.is_active}, ${testSlide.display_order})
      `;
      results.simpleInsert = 'success';
    } catch (err: any) {
      results.simpleInsertError = err.message;
    }
    
    // Step 3: Check how many slides exist now
    const count = await sql`SELECT COUNT(*) as count FROM hero_slides`;
    results.totalSlides = parseInt(count[0]?.count || '0');
    
    return NextResponse.json(results);
    
  } catch (err) {
    console.error('Debug failed:', err);
    return NextResponse.json({ 
      error: 'Debug failed',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
