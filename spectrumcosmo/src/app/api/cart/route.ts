import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

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

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getVerifiedUser(req);
    if (error && error.status !== 401) return error;

    if (user) {
      const sql = getDb();
      const [cart] = await sql`SELECT items FROM user_carts WHERE user_id = ${user.id}`;
      const items = cart?.items || [];
      return NextResponse.json({ success: true, items });
    }

    const sessionId = req.cookies.get('user_session_id')?.value;
    if (!sessionId) {
      return NextResponse.json({ success: true, items: [] });
    }

    const sql = getDb();
    const [sessionCart] = await sql`SELECT items FROM cart_sessions WHERE session_id = ${sessionId}`;
    const items = sessionCart?.items || [];
    return NextResponse.json({ success: true, items });
  } catch (err) {
    console.error('Cart GET error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cart', items: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getVerifiedUser(req);
    if (error && error.status !== 401) return error;

    const { items } = await req.json();
    
    // Validate items
    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Invalid cart data' },
        { status: 400 }
      );
    }

    const sql = getDb();
    const response = NextResponse.json({ success: true, items });

    const itemCount = items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0);
    const totalAmount = items.reduce((sum: number, i: any) => sum + (i.priceUsd || 0) * (i.quantity || 1), 0);

    if (user) {
      // Save to user_carts
      await sql`
        INSERT INTO user_carts (user_id, items, updated_at)
        VALUES (${user.id}, ${JSON.stringify(items)}, NOW())
        ON CONFLICT (user_id) DO UPDATE SET items = EXCLUDED.items, updated_at = NOW()
      `;
      
      // Also update session cart for cross-device sync
      const sessionId = req.cookies.get('user_session_id')?.value;
      if (sessionId) {
        await sql`
          INSERT INTO cart_sessions (session_id, user_id, items, status, item_count, total_amount, last_activity, updated_at)
          VALUES (${sessionId}, ${user.id}, ${JSON.stringify(items)}, 'active', ${itemCount}, ${totalAmount}, NOW(), NOW())
          ON CONFLICT (session_id) DO UPDATE SET 
            items = EXCLUDED.items, 
            item_count = EXCLUDED.item_count, 
            total_amount = EXCLUDED.total_amount, 
            last_activity = NOW(),
            updated_at = NOW()
        `;
      }
    } else {
      // Guest user
      const sessionId = getSessionId(req, response);
      await sql`
        INSERT INTO cart_sessions (session_id, items, status, item_count, total_amount, last_activity, updated_at)
        VALUES (${sessionId}, ${JSON.stringify(items)}, 'active', ${itemCount}, ${totalAmount}, NOW(), NOW())
        ON CONFLICT (session_id) DO UPDATE SET 
          items = EXCLUDED.items, 
          item_count = EXCLUDED.item_count, 
          total_amount = EXCLUDED.total_amount, 
          last_activity = NOW(),
          updated_at = NOW()
      `;
    }

    return response;
  } catch (err) {
    console.error('Cart POST error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to save cart' },
      { status: 500 }
    );
  }
}

// Optional: Add DELETE endpoint to clear cart
export async function DELETE(req: NextRequest) {
  try {
    const { user, error } = await getVerifiedUser(req);
    if (error && error.status !== 401) return error;

    const sql = getDb();

    if (user) {
      // Clear user's cart
      await sql`UPDATE user_carts SET items = '[]', updated_at = NOW() WHERE user_id = ${user.id}`;
      
      // Also clear session cart
      const sessionId = req.cookies.get('user_session_id')?.value;
      if (sessionId) {
        await sql`
          UPDATE cart_sessions 
          SET items = '[]', item_count = 0, total_amount = 0, updated_at = NOW() 
          WHERE session_id = ${sessionId}
        `;
      }
    } else {
      const sessionId = req.cookies.get('user_session_id')?.value;
      if (sessionId) {
        await sql`
          UPDATE cart_sessions 
          SET items = '[]', item_count = 0, total_amount = 0, updated_at = NOW() 
          WHERE session_id = ${sessionId}
        `;
      }
    }

    return NextResponse.json({ success: true, items: [] });
  } catch (err) {
    console.error('Cart DELETE error:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}
