import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getDb();
    
    // Check if slides already exist
    const existing = await sql`SELECT COUNT(*) as count FROM hero_slides`;
    const slideCount = parseInt(existing[0]?.count || '0');
    
    if (slideCount > 0) {
      return NextResponse.json({ 
        message: `Slides already exist (${slideCount} slides found). No changes made.`,
        existingCount: slideCount
      });
    }
    
    // Insert default slides
    await sql`
      INSERT INTO hero_slides (image_url, title, description, button_text, button_link, is_active, display_order, autoplay_delay)
      VALUES 
        (
          'https://res.cloudinary.com/dfsvnaslv/image/upload/v1778101210/pc97xdh08ivrbtvdzins.jpg',
          'Anime Mugs',
          'Sip in style with our exclusive collection',
          'Shop Now',
          '/products',
          true,
          1,
          5000
        ),
        (
          'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_16.15.36_ubl2ww.jpg',
          'Premium T-Shirts',
          'Wear your excitement with pride',
          'Shop T-Shirts',
          '/products?category=T-Shirts',
          true,
          2,
          5000
        ),
        (
          'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-04_at_23.58.16_a0z7ns.jpg',
          'Hoodies Collection',
          'Stay warm and stylish',
          'Shop Hoodies',
          '/products?category=Hoodies',
          true,
          3,
          5000
        )
    `;
    
    // Verify the insert worked
    const afterInsert = await sql`SELECT COUNT(*) as count FROM hero_slides WHERE is_active = true`;
    const newCount = parseInt(afterInsert[0]?.count || '0');
    
    return NextResponse.json({ 
      message: `Success! ${newCount} hero slide(s) added to database.`,
      slidesAdded: newCount
    });
    
  } catch (err) {
    console.error('Seed failed:', err);
    return NextResponse.json({ 
      error: 'Failed to seed hero slides',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
