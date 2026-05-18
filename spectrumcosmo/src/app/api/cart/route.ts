import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

// Helper to get or create session ID from cookie
function getSessionId(request: NextRequest, response: NextResponse) {
  let sessionId = request.cookies.get('user_session_id')?.value;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    response.cookies.set('user_session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    });
  }
  return sessionId;
}

// GET – fetch cart (supports both logged-in users and guest sessions)
export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error && error.status !== 401) return error;

  // For logged-in users, fetch from user_carts
  if (user) {
    const sql = getDb();
    const [cart] = await sql`
      SELECT items FROM user_carts WHERE user_id = ${user.id}
    `;
    return NextResponse.json({ items: cart?.items || [] });
  }

  // For guests, fetch from cart_sessions using session cookie
  const sessionId = req.cookies.get('user_session_id')?.value;
  if (!sessionId) {
    return NextResponse.json({ items: [] });
  }

  const sql = getDb();
  const [sessionCart] = await sql`
    SELECT items FROM cart_sessions WHERE session_id = ${sessionId}
  `;
  return NextResponse.json({ items: sessionCart?.items || [] });
}

// POST – save cart (supports both logged-in users and guest sessions)
export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error && error.status !== 401) return error;

  const { items } = await req.json();
  const sql = getDb();

  // Create a response object to set cookies if needed
  const response = NextResponse.json({ success: true });

  if (user) {
    // Logged-in user – store in user_carts
    await sql`
      INSERT INTO user_carts (user_id, items, updated_at)
      VALUES (${user.id}, ${JSON.stringify(items)}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        items = EXCLUDED.items,
        updated_at = NOW()
    `;
    // Also update cart_sessions for this user (for analytics)
    const sessionId = req.cookies.get('user_session_id')?.value;
    if (sessionId) {
      await sql`
        INSERT INTO cart_sessions (session_id, user_id, items, status, last_activity)
        VALUES (${sessionId}, ${user.id}, ${JSON.stringify(items)}, 'active', NOW())
        ON CONFLICT (session_id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          items = EXCLUDED.items,
          last_activity = NOW(),
          status = 'active'
      `;
    }
  } else {
    // Guest – store in cart_sessions
    const sessionId = getSessionId(req, response);
    await sql`
      INSERT INTO cart_sessions (session_id, items, status, last_activity)
      VALUES (${sessionId}, ${JSON.stringify(items)}, 'active', NOW())
      ON CONFLICT (session_id) DO UPDATE SET
        items = EXCLUDED.items,
        last_activity = NOW(),
        status = 'active'
    `;
  }

  return response;
}
