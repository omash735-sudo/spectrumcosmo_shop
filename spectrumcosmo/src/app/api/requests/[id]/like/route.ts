// app/api/requests/[id]/like/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  try {
    const { id: requestId } = await params;
    const sql = getDb();

    // Check if already liked
    const [existing] = await sql`
      SELECT id FROM request_likes
      WHERE request_id = ${requestId} AND user_id = ${user.id}
    `;

    if (existing) {
      // Unlike
      await sql`
        DELETE FROM request_likes
        WHERE request_id = ${requestId} AND user_id = ${user.id}
      `;
      await sql`
        UPDATE product_requests
        SET like_count = like_count - 1
        WHERE id = ${requestId}
      `;
      return NextResponse.json({ liked: false, message: 'Removed like' });
    } else {
      // Like
      await sql`
        INSERT INTO request_likes (request_id, user_id)
        VALUES (${requestId}, ${user.id})
      `;
      await sql`
        UPDATE product_requests
        SET like_count = like_count + 1
        WHERE id = ${requestId}
      `;
      return NextResponse.json({ liked: true, message: 'Added like' });
    }
  } catch (err: any) {
    console.error('Like error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
