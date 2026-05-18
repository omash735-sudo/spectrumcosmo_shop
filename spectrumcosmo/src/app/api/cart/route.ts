import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

function ensureSessionId(request: NextRequest, response: NextResponse): string {
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

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error && error.status !== 401) return error;

  if (user) {
    const sql = getDb();
    const [cart] = await sql`SELECT items FROM user_carts WHERE user_id = ${user.id}`;
    return NextResponse.json({ items: cart?.items || [] });
  }

  // Guest: try to get session ID from cookie
  const sessionId = req.cookies.get('user_session_id')?.value;
  if (!sessionId) return NextResponse.json({ items: [] });

  const sql = getDb();
  const [sessionCart] = await sql`SELECT items FROM cart_sessions WHERE session_id = ${sessionId}`;
  return NextResponse.json({ items: sessionCart?.items || [] });
}

export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error && error.status !== 401) return error;

  const { items } = await req.json();
  const sql = getDb();
  const response = NextResponse.json({ success: true });

  const itemCount = items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0);
  const totalAmount = items.reduce((sum: number, i: any) => sum + (i.priceUsd || 0) * (i.quantity || 1), 0);

  if (user) {
    // Logged in user
    await sql`
      INSERT INTO user_carts (user_id, items, updated_at)
      VALUES (${user.id}, ${JSON.stringify(items)}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET items = EXCLUDED.items, updated_at = NOW()
    `;
    const sessionId = req.cookies.get('user_session_id')?.value;
    if (sessionId) {
      await sql`
        INSERT INTO cart_sessions (session_id, user_id, items, status, item_count, total_amount, last_activity)
        VALUES (${sessionId}, ${user.id}, ${JSON.stringify(items)}, 'active', ${itemCount}, ${totalAmount}, NOW())
        ON CONFLICT (session_id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          items = EXCLUDED.items,
          status = 'active',
          item_count = EXCLUDED.item_count,
          total_amount = EXCLUDED.total_amount,
          last_activity = NOW()
      `;
    }
  } else {
    // Guest – ensure session cookie exists
    const sessionId = ensureSessionId(req, response);
    await sql`
      INSERT INTO cart_sessions (session_id, items, status, item_count, total_amount, last_activity)
      VALUES (${sessionId}, ${JSON.stringify(items)}, 'active', ${itemCount}, ${totalAmount}, NOW())
      ON CONFLICT (session_id) DO UPDATE SET
        items = EXCLUDED.items,
        status = 'active',
        item_count = EXCLUDED.item_count,
        total_amount = EXCLUDED.total_amount,
        last_activity = NOW()
    `;
  }

  return response;
}
