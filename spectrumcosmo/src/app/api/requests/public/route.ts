// app/api/requests/public/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '12');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const sortBy = url.searchParams.get('sort') || 'popular'; // popular, newest, most_voted
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');

    const sql = getDb();

    // Build WHERE clause
    let whereConditions = ["r.status = 'approved'"];
    if (category && category !== 'all') {
      whereConditions.push(`c.name = ${category}`);
    }
    if (search) {
      whereConditions.push(`(r.title ILIKE ${'%' + search + '%'} OR r.description ILIKE ${'%' + search + '%'})`);
    }
    const whereClause = whereConditions.join(' AND ');

    // Build ORDER BY clause
    let orderClause = '';
    switch (sortBy) {
      case 'newest':
        orderClause = 'r.created_at DESC';
        break;
      case 'most_voted':
        orderClause = 'r.like_count DESC';
        break;
      case 'oldest':
        orderClause = 'r.created_at ASC';
        break;
      default:
        orderClause = 'r.like_count DESC, r.created_at DESC';
    }

    // Get total count for pagination
    const [countResult] = await sql`
      SELECT COUNT(*) as total
      FROM product_requests r
      LEFT JOIN categories c ON c.id = r.category_id
      WHERE ${sql.raw(whereClause)}
    `;
    const total = parseInt(countResult?.total || '0');

    // Check if user is logged in
    let userId = null;
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = cookies();
      const token = cookieStore.get('user_token')?.value;
      if (token) {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'spectrumcosmo-secret-key-2024') as any;
        userId = decoded.id;
      }
    } catch (err) {
      // User not logged in, continue
    }

    // Get requests with user-specific like status
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
        ${userId ? sql`COALESCE((SELECT 1 FROM request_likes WHERE request_id = r.id AND user_id = ${userId}), 0) as user_liked` : sql`0 as user_liked`}
      FROM product_requests r
      LEFT JOIN categories c ON c.id = r.category_id
      WHERE ${sql.raw(whereClause)}
      ORDER BY ${sql.raw(orderClause)}
      LIMIT ${limit} OFFSET ${offset}
    `;

    return NextResponse.json({
      success: true,
      data: Array.isArray(query) ? query : [],
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
        nextOffset: offset + limit < total ? offset + limit : null,
        prevOffset: offset > 0 ? Math.max(0, offset - limit) : null,
      },
      filters: {
        sort: sortBy,
        category: category || null,
        search: search || null,
      }
    });
  } catch (err: any) {
    console.error('Public requests API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error', data: [], pagination: { total: 0, limit: 0, offset: 0, hasMore: false } },
      { status: 500 }
    );
  }
}
