import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  const { id } = await params;
  const sql = getDb();

  const [existing] = await sql`
    SELECT id FROM request_likes WHERE request_id = ${id} AND user_id = ${user.id}
  `;

  if (existing) {
    await sql`DELETE FROM request_likes WHERE request_id = ${id} AND user_id = ${user.id}`;
    await sql`UPDATE product_requests SET like_count = like_count - 1 WHERE id = ${id}`;
    return NextResponse.json({ liked: false });
  } else {
    await sql`INSERT INTO request_likes (request_id, user_id) VALUES (${id}, ${user.id})`;
    await sql`UPDATE product_requests SET like_count = like_count + 1 WHERE id = ${id}`;
    return NextResponse.json({ liked: true });
  }
}
