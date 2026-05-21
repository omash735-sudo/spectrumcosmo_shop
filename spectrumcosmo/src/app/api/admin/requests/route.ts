import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || 'pending';
  const limit = parseInt(url.searchParams.get('limit') || '50');

  const sql = getDb();
  const requests = await sql`
    SELECT 
      r.*,
      u.name as user_name,
      u.email as user_email,
      COALESCE(COUNT(DISTINCT ri.id), 0) as image_count,
      COALESCE(COUNT(DISTINCT rl.id), 0) as like_count
    FROM product_requests r
    JOIN users u ON u.id = r.user_id
    LEFT JOIN request_images ri ON ri.request_id = r.id
    LEFT JOIN request_likes rl ON rl.request_id = r.id
    WHERE r.status = ${status}
    GROUP BY r.id, u.name, u.email
    ORDER BY r.created_at ASC
    LIMIT ${limit}
  `;

  return NextResponse.json(requests);
}

export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { id, status, admin_notes } = await req.json();

  if (!id || !status) {
    return NextResponse.json({ error: 'id and status required' }, { status: 400 });
  }

  const sql = getDb();

  const [current] = await sql`SELECT status FROM product_requests WHERE id = ${id}`;
  const oldStatus = current?.status;

  await sql`
    UPDATE product_requests 
    SET status = ${status}, admin_notes = ${admin_notes || null}, updated_at = NOW()
    WHERE id = ${id}
  `;

  await sql`
    INSERT INTO request_status_history (request_id, old_status, new_status, changed_by, note)
    VALUES (${id}, ${oldStatus}, ${status}, ${null}, ${admin_notes || null})
  `;

  return NextResponse.json({ success: true });
}
