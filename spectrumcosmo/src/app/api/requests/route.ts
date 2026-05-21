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

    if (!imageUrls || imageUrls.length === 0) {
      return NextResponse.json({ error: 'At least one image is required' }, { status: 400 });
    }

    const sql = getDb();

    const [request] = await sql`
      INSERT INTO product_requests (user_id, title, description, category_id, status, created_at, updated_at)
      VALUES (${user.id}, ${title}, ${description}, ${categoryId || null}, 'pending', NOW(), NOW())
      RETURNING id
    `;

    if (!request || !request.id) {
      throw new Error('Failed to create request');
    }

    if (imageUrls && imageUrls.length > 0) {
      for (let i = 0; i < imageUrls.length; i++) {
        await sql`
          INSERT INTO request_images (request_id, image_url, display_order)
          VALUES (${request.id}, ${imageUrls[i]}, ${i})
        `;
      }
    }

    console.log(`Request created: ${request.id} by user ${user.id}`);

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
    query = await sql`
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
      ${categoryId ? sql`AND r.category_id = ${parseInt(categoryId)}` : sql``}
      ORDER BY r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  } else {
    const statusFilter = status === 'approved' ? 'r.status = \'approved\'' : 'r.status IN (\'approved\', \'available\')';
    query = await sql`
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
        COALESCE((SELECT COUNT(*) FROM request_likes WHERE request_id = r.id AND user_id = ${user.id}), 0) as user_liked
      FROM product_requests r
      LEFT JOIN categories c ON c.id = r.category_id
      WHERE ${sql.raw(statusFilter)}
      ${categoryId ? sql`AND r.category_id = ${parseInt(categoryId)}` : sql``}
      ORDER BY r.like_count DESC, r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;
  }

  return NextResponse.json(query);
}
