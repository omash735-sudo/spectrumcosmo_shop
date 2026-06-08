import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getDb();
    
    // Step 1: Create the table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS hero_slides (
        id SERIAL PRIMARY KEY,
        image_url TEXT NOT NULL,
        title VARCHAR(255),
        description TEXT,
        button_text VARCHAR(100),
        button_link VARCHAR(255),
        display_order INTEGER DEFAULT 0,
        autoplay_delay INTEGER DEFAULT 5000,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    // Step 2: Clear any existing data (optional)
    await sql`DELETE FROM hero_slides`;
    
    // Step 3: Insert slides
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
    
    // Step 4: Verify
    const result = await sql`SELECT COUNT(*) as count FROM hero_slides WHERE is_active = true`;
    const slideCount = parseInt(result[0]?.count || '0');
    
    return NextResponse.json({ 
      success: true,
      message: `Table created and ${slideCount} slide(s) added successfully!`,
      slidesAdded: slideCount
    });
    
  } catch (err) {
    console.error('Seed failed:', err);
    return NextResponse.json({ 
      error: 'Failed to setup hero slides',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
