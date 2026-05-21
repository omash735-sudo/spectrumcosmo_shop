import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const revalidate = 60;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '12');
    
    const sql = getDb();
    const images = await sql`
      SELECT id, image_url, title, description, like_count
      FROM inspiration_images
      WHERE is_active = true
      ORDER BY display_order ASC, created_at DESC
      LIMIT ${limit}
    `;
    
    // Add user_liked flag (will be populated by separate endpoint if user logged in)
    const imagesWithLike = images.map(img => ({
      ...img,
      user_liked: false,
    }));
    
    return NextResponse.json(imagesWithLike);
  } catch (err) {
    console.error('Failed to fetch inspiration images:', err);
    return NextResponse.json([]);
  }
}
