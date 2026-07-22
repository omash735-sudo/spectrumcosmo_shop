import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { user: userToken, error: authError } = await getVerifiedUser(req);

    if (authError) {
      console.log('Auth error in /me:', authError);
      return NextResponse.json({ user: null });
    }

    if (!userToken) {
      console.log('No user token in /me');
      return NextResponse.json({ user: null });
    }

    const sql = getDb();
    const [user] = await sql`
      SELECT
        id,
        name,
        email,
        phone,
        profile_image,
        is_admin,
        account_status,
        created_at
      FROM users
      WHERE id = ${userToken.id}
    `;

    if (!user) {
      console.log('User not found in database:', userToken.id);
      return NextResponse.json({ user: null });
    }

    const [subscription] = await sql`
      SELECT status FROM subscribers
      WHERE email = ${user.email}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const newsletter_subscribed = subscription?.status === 'confirmed';

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profile_image,
        isAdmin: user.is_admin || false,
        accountStatus: user.account_status,
        newsletter_subscribed: newsletter_subscribed || false,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error('Auth me error:', err);
    return NextResponse.json({ user: null });
  }
}
