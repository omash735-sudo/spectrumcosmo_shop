import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || 'pending';
  const categoryId = url.searchParams.get('categoryId');
  const limit = parseInt(url.searchParams.get('limit') || '50');

  const sql = getDb();
  
  let queryText = `
    SELECT 
      r.*,
      u.name as user_name,
      u.email as user_email,
      c.name as category_name,
      c.id as category_id,
      COALESCE(COUNT(DISTINCT ri.id), 0) as image_count,
      COALESCE(COUNT(DISTINCT rl.id), 0) as like_count
    FROM product_requests r
    JOIN users u ON u.id = r.user_id
    LEFT JOIN categories c ON c.id = r.category_id
    LEFT JOIN request_images ri ON ri.request_id = r.id
    LEFT JOIN request_likes rl ON rl.request_id = r.id
    WHERE r.status = $1
  `;
  
  const params: any[] = [status];
  
  if (categoryId) {
    queryText += ` AND r.category_id = $2`;
    params.push(parseInt(categoryId));
  }
  
  queryText += `
    GROUP BY r.id, u.name, u.email, c.name, c.id
    ORDER BY r.created_at ASC
    LIMIT $${params.length + 1}
  `;
  params.push(limit);
  
  const requests = await sql.unsafe(queryText, params);
  
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
