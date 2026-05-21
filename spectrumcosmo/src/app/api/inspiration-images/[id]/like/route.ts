import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  const { id } = await params;
  const sql = getDb();

  // Check if user already liked
  const [existing] = await sql`
    SELECT id FROM inspiration_likes WHERE image_id = ${id} AND user_id = ${user.id}
  `;

  if (existing) {
    // Unlike
    await sql`DELETE FROM inspiration_likes WHERE image_id = ${id} AND user_id = ${user.id}`;
    await sql`UPDATE inspiration_images SET like_count = like_count - 1 WHERE id = ${id}`;
    return NextResponse.json({ liked: false });
  } else {
    // Like
    await sql`INSERT INTO inspiration_likes (image_id, user_id) VALUES (${id}, ${user.id})`;
    await sql`UPDATE inspiration_images SET like_count = like_count + 1 WHERE id = ${id}`;
    return NextResponse.json({ liked: true });
  }
}
