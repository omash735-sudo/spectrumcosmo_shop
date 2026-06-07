// app/api/requests/public/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '12'), 50);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const sortBy = url.searchParams.get('sort') || 'popular';
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');

    const sql = getDb();

    // Build WHERE conditions and parameter array
    const whereConditions: string[] = ["r.status = 'approved'"];
    const params: any[] = [];
    let paramIndex = 1;

    if (category && category !== 'all') {
      whereConditions.push(`c.name = $${paramIndex++}`);
      params.push(category);
    }
    if (search) {
      whereConditions.push(`(r.title ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }
    const whereClause = whereConditions.join(' AND ');

    // ORDER BY clause (safe because values are controlled)
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

    // Total count query
    const countSql = `
      SELECT COUNT(*) as total
      FROM product_requests r
      LEFT JOIN categories c ON c.id = r.category_id
      WHERE ${whereClause}
    `;
    const countResult = await sql(countSql, params);
    const total = Number((countResult as any[])[0]?.total ?? 0);

    // Main data query
    const dataSql = `
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
      WHERE ${whereClause}
      ORDER BY ${orderClause}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const dataParams = [...params, limit, offset];
    const dataResult = await sql(dataSql, dataParams);
    const requests = dataResult as any[];

    return NextResponse.json({
      success: true,
      data: requests,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      filters: {
        sort: sortBy,
        category: category || null,
        search: search || null,
      },
    });
  } catch (err) {
    console.error('Public requests API error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage, data: [] },
      { status: 500 }
    );
  }
}
