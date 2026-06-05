// app/api/inspiration/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Types
interface InspirationImage {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  like_count: number;
  display_order: number;
  created_at: Date;
}

interface InspirationImageWithLike extends InspirationImage {
  user_liked: boolean;
}

interface PaginatedResponse {
  images: InspirationImageWithLike[];
  pagination: {
    total: number;
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

export const revalidate = 60;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '12'), 50);
    const cursor = url.searchParams.get('cursor');
    
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json({ error: 'Invalid limit parameter' }, { status: 400 });
    }
    
    const sql = getDb();
    
    // Get total count
    const [countResult] = await sql`
      SELECT COUNT(*) as total FROM inspiration_images WHERE is_active = true
    `;
    const total = parseInt(countResult?.total || '0', 10);
    
    // Build query with cursor-based pagination
    let imagesQuery;
    if (cursor) {
      imagesQuery = await sql`
        SELECT id, image_url, title, description, like_count, display_order, created_at
        FROM inspiration_images
        WHERE is_active = true AND display_order > (SELECT display_order FROM inspiration_images WHERE id = ${cursor})
        ORDER BY display_order ASC, created_at DESC
        LIMIT ${limit}
      `;
    } else {
      imagesQuery = await sql`
        SELECT id, image_url, title, description, like_count, display_order, created_at
        FROM inspiration_images
        WHERE is_active = true
        ORDER BY display_order ASC, created_at DESC
        LIMIT ${limit}
      `;
    }
    
    const images = imagesQuery as InspirationImage[];
    
    // Add user_liked flag (false by default, will be populated by separate endpoint if user logged in)
    const imagesWithLike: InspirationImageWithLike[] = images.map((image: InspirationImage) => ({
      ...image,
      user_liked: false,
    }));
    
    // Determine if there are more images
    const hasMore = images.length === limit;
    const nextCursor = hasMore && images.length > 0 ? images[images.length - 1].id : undefined;
    
    const response: PaginatedResponse = {
      images: imagesWithLike,
      pagination: {
        total,
        limit,
        hasMore,
        nextCursor,
      },
    };
    
    return NextResponse.json(response);
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    console.error('Failed to fetch inspiration images:', errorMessage);
    return NextResponse.json({ error: 'Failed to load inspiration images' }, { status: 500 });
  }
}
