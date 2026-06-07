// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/auth';
import { getDb, queryAsArray, queryOne } from '@/lib/db';

async function ensureUsersTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      profile_image TEXT,
      is_admin BOOLEAN DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
}

export async function GET(req: NextRequest) {
  const { user: userToken, error: authError } = await getVerifiedUser(req);

  // If auth fails (missing token, expired, etc.), return null user (not an error)
  if (authError || !userToken) {
    return NextResponse.json({ user: null });
  }

  try {
    await ensureUsersTable();

    // Fetch user by ID – use queryAsArray to get a real array
    const users = await queryAsArray<{
      id: string;
      name: string;
      email: string;
      phone: string | null;
      profileImage: string | null;
      is_admin: boolean;
    }>`
      SELECT 
        id, 
        name, 
        email, 
        phone, 
        profile_image AS "profileImage",
        is_admin
      FROM users 
      WHERE id = ${userToken.id}
    `;

    if (users.length === 0) {
      return NextResponse.json({ user: null });
    }

    const user = users[0];

    // Fetch newsletter subscription status – use queryOne
    const subscription = await queryOne<{ is_subscribed: boolean }>`
      SELECT is_subscribed FROM newsletter_subscriptions
      WHERE user_id = ${userToken.id} OR email = ${user.email}
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    const newsletter_subscribed = subscription?.is_subscribed ?? true;

    return NextResponse.json({
      user: {
        ...user,
        newsletter_subscribed,
      },
    });
  } catch (err) {
    console.error('Auth me error:', err);
    // On any server error, return null user (not a 500)
    return NextResponse.json({ user: null });
  }
}
