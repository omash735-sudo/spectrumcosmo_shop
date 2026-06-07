// app/api/inspiration/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryAsArray } from '@/lib/db';
import { InspirationImage, InspirationImageWithLike, PaginatedResponse } from '@/types';

export const revalidate = 60;

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '12'), 50);
    const cursor = url.searchParams.get('cursor');

    if (isNaN(limit) || limit < 1) {
      return NextResponse.json({ error: 'Invalid limit parameter' }, { status: 400 });
    }

    // Get total count – use queryOne
    const countResult = await queryOne<{ total: string }>`
      SELECT COUNT(*) as total FROM inspiration_images WHERE is_active = true
    `;
    const total = parseInt(countResult?.total || '0', 10);

    // Get images – use queryAsArray (returns a typed array)
    let images: InspirationImage[];
    if (cursor) {
      images = await queryAsArray<InspirationImage>`
        SELECT id, image_url, title, description, like_count, display_order, created_at
        FROM inspiration_images
        WHERE is_active = true AND id > ${cursor}
        ORDER BY display_order ASC, created_at DESC
        LIMIT ${limit}
      `;
    } else {
      images = await queryAsArray<InspirationImage>`
        SELECT id, image_url, title, description, like_count, display_order, created_at
        FROM inspiration_images
        WHERE is_active = true
        ORDER BY display_order ASC, created_at DESC
        LIMIT ${limit}
      `;
    }

    // Add user_liked flag (false by default)
    const imagesWithLike: InspirationImageWithLike[] = images.map((image) => ({
      ...image,
      user_liked: false,
    }));

    const hasMore = images.length === limit;
    const nextCursor = hasMore && images.length > 0 ? images[images.length - 1].id : undefined;

    const response: PaginatedResponse<InspirationImageWithLike> = {
      data: imagesWithLike,
      pagination: {
        total,
        limit,
        offset: 0,
        hasMore,
      },
    };

    return NextResponse.json(response);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    console.error('Failed to fetch inspiration images:', errorMessage);
    return NextResponse.json({ error: 'Failed to load inspiration images' }, { status: 500 });
  }
}
