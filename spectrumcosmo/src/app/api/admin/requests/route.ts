import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || 'pending';

  const sql = getDb();

  try {
    // Simple query without complex joins
    const requests = await sql`
      SELECT 
        r.id,
        r.title,
        r.description,
        r.status,
        r.like_count,
        r.created_at,
        r.user_id
      FROM product_requests r
      WHERE r.status = ${status}
      ORDER BY r.created_at DESC
    `;

    // Return empty array if no results
    if (!requests || requests.length === 0) {
      return NextResponse.json([]);
    }

    // Get user info for each request
    const results = [];
    for (const req of requests) {
      const [user] = await sql`
        SELECT name, email FROM users WHERE id = ${req.user_id}
      `;
      
      const [imageCount] = await sql`
        SELECT COUNT(*) as count FROM request_images WHERE request_id = ${req.id}
      `;
      
      const [likeCount] = await sql`
        SELECT COUNT(*) as count FROM request_likes WHERE request_id = ${req.id}
      `;

      results.push({
        id: req.id,
        title: req.title,
        description: req.description,
        status: req.status,
        like_count: parseInt(likeCount?.count || '0'),
        created_at: req.created_at,
        user_name: user?.name || 'Unknown',
        user_email: user?.email || '',
        image_count: parseInt(imageCount?.count || '0'),
        category_name: null,
      });
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error('Admin requests error:', err);
    return NextResponse.json([]);
  }
}

export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id, status, admin_notes } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 });
    }

    const sql = getDb();

    await sql`
      UPDATE product_requests 
      SET status = ${status}, admin_notes = ${admin_notes || null}, updated_at = NOW()
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin PATCH error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
