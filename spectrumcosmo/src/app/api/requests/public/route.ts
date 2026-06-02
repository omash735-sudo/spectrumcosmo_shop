import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Public endpoint - no authentication required
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const sql = getDb();

    const query = await sql`
      SELECT 
        r.id,
        r.title,
        r.description,
        r.status,
        r.like_count,
        r.created_at,
        c.name as category_name,
        c.id as category_id,
        COALESCE((SELECT COUNT(*) FROM request_images WHERE request_id = r.id), 0) as image_count,
        0 as user_liked
      FROM product_requests r
      LEFT JOIN categories c ON c.id = r.category_id
      WHERE r.status = 'approved'
      ORDER BY r.like_count DESC, r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    return NextResponse.json({ 
      success: true, 
      data: Array.isArray(query) ? query : [] 
    });
  } catch (err: any) {
    console.error('Public requests API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error', data: [] },
      { status: 500 }
    );
  }
}
