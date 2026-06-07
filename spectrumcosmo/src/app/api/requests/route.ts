// app/api/requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne, queryAsArray } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  try {
    const { title, description, categoryId, imageUrls } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description required' }, { status: 400 });
    }
    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json({ error: 'At least one image is required' }, { status: 400 });
    }

    const sql = getDb();

    const newRequest = await queryOne<{ id: string }>`
      INSERT INTO product_requests (user_id, title, description, category_id, status, created_at, updated_at)
      VALUES (${user.id}, ${title}, ${description}, ${categoryId || null}, 'pending', NOW(), NOW())
      RETURNING id
    `;

    if (!newRequest) {
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }

    for (let i = 0; i < imageUrls.length; i++) {
      await sql`
        INSERT INTO request_images (request_id, image_url, display_order)
        VALUES (${newRequest.id}, ${imageUrls[i]}, ${i})
      `;
    }

    return NextResponse.json({ success: true, id: newRequest.id }, { status: 201 });
  } catch (err) {
    console.error('Request submission error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getVerifiedUser(req);
    if (error) return error;

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const categoryId = url.searchParams.get('categoryId');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const sql = getDb();

    // Helper to safely parse categoryId
    const categoryIdNum = categoryId ? parseInt(categoryId, 10) : null;
    const categoryCondition = categoryIdNum ? `AND r.category_id = ${categoryIdNum}` : '';

    let query;
    if (status === 'my') {
      query = await queryAsArray`
        SELECT 
          r.id,
          r.title,
          r.description,
          r.status,
          r.like_count,
          r.created_at,
          c.name as category_name,
          COALESCE((SELECT COUNT(*) FROM request_images WHERE request_id = r.id), 0) as image_count,
          COALESCE((SELECT COUNT(*) FROM request_likes WHERE request_id = r.id AND user_id = ${user.id}), 0) as user_liked
        FROM product_requests r
        LEFT JOIN categories c ON c.id = r.category_id
        WHERE r.user_id = ${user.id}
        ${categoryIdNum ? sql`AND r.category_id = ${categoryIdNum}` : sql``}
        ORDER BY r.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      // Build status filter as raw SQL fragment (safe because it's from our controlled logic)
      let statusFilter = "r.status IN ('approved', 'available')";
      if (status === 'approved') {
        statusFilter = "r.status = 'approved'";
      }
      // Use raw SQL string with parameters for user_id and other conditions
      const rawSql = `
        SELECT 
          r.id,
          r.title,
          r.description,
          r.status,
          r.like_count,
          r.created_at,
          c.name as category_name,
          COALESCE((SELECT COUNT(*) FROM request_images WHERE request_id = r.id), 0) as image_count,
          COALESCE((SELECT COUNT(DISTINCT rl.id) FROM request_likes rl WHERE rl.request_id = r.id), 0) as like_count,
          COALESCE((SELECT COUNT(*) FROM request_likes WHERE request_id = r.id AND user_id = $1), 0) as user_liked
        FROM product_requests r
        LEFT JOIN categories c ON c.id = r.category_id
        WHERE ${statusFilter}
        ${categoryIdNum ? `AND r.category_id = ${categoryIdNum}` : ''}
        ORDER BY r.like_count DESC, r.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const params = [user.id, limit, offset];
      const result = await sql(rawSql, params);
      query = result as any[];
    }

    return NextResponse.json({ success: true, data: query });
  } catch (err) {
    console.error('Requests GET error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage, data: [] },
      { status: 500 }
    );
  }
}
