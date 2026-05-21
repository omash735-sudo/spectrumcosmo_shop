import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  try {
    const { title, description, categoryId, imageUrls } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description required' }, { status: 400 });
    }

    const sql = getDb();

    const [request] = await sql`
      INSERT INTO product_requests (user_id, title, description, category_id, status, created_at, updated_at)
      VALUES (${user.id}, ${title}, ${description}, ${categoryId || null}, 'pending', NOW(), NOW())
      RETURNING id
    `;

    if (imageUrls && imageUrls.length > 0) {
      for (let i = 0; i < imageUrls.length; i++) {
        await sql`
          INSERT INTO request_images (request_id, image_url, display_order)
          VALUES (${request.id}, ${imageUrls[i]}, ${i})
        `;
      }
    }

    return NextResponse.json({ success: true, id: request.id }, { status: 201 });
  } catch (err: any) {
    console.error('Request submission error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const categoryId = url.searchParams.get('categoryId');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const sql = getDb();

  let query;
  if (status === 'my') {
    query = sql`
      SELECT 
        r.*,
        c.name as category_name,
        COALESCE(COUNT(DISTINCT ri.id), 0) as image_count,
        COALESCE(SUM(CASE WHEN rl.user_id = ${user.id} THEN 1 ELSE 0 END), 0) as user_liked
      FROM product_requests r
      LEFT JOIN categories c ON c.id = r.category_id
      LEFT JOIN request_images ri ON ri.request_id = r.id
      LEFT JOIN request_likes rl ON rl.request_id = r.id
      WHERE r.user_id = ${user.id}
      ${categoryId ? sql`AND r.category_id = ${categoryId}` : sql``}
      GROUP BY r.id, c.name
      ORDER BY r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else {
    const statusFilter = status === 'approved' ? 'status = \'approved\'' : 'status IN (\'approved\', \'available\')';
    query = sql`
      SELECT 
        r.*,
        c.name as category_name,
        COALESCE(COUNT(DISTINCT ri.id), 0) as image_count,
        COALESCE(COUNT(DISTINCT rl.id), 0) as like_count,
        COALESCE(SUM(CASE WHEN rl.user_id = ${user.id} THEN 1 ELSE 0 END), 0) as user_liked
      FROM product_requests r
      LEFT JOIN categories c ON c.id = r.category_id
      LEFT JOIN request_images ri ON ri.request_id = r.id
      LEFT JOIN request_likes rl ON rl.request_id = r.id
      WHERE ${sql.raw(statusFilter)}
      ${categoryId ? sql`AND r.category_id = ${categoryId}` : sql``}
      GROUP BY r.id, c.name
      ORDER BY r.like_count DESC, r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  const requests = await query;
  return NextResponse.json(requests);
}
