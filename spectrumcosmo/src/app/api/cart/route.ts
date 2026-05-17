import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  if (!user) {
    return NextResponse.json({ items: [] });
  }

  const sql = getDb();
  const [cart] = await sql`
    SELECT items FROM user_carts WHERE user_id = ${user.id}
  `;

  return NextResponse.json({ items: cart?.items || [] });
}
