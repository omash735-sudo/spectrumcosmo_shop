import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

// GET – fetch user's cart from database
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

// POST – save user's cart to database
export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { items } = await req.json();
  const sql = getDb();

  await sql`
    INSERT INTO user_carts (user_id, items, updated_at)
    VALUES (${user.id}, ${JSON.stringify(items)}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      items = EXCLUDED.items,
      updated_at = NOW()
  `;

  return NextResponse.json({ success: true });
}
