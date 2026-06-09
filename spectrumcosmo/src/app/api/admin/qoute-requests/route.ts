import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;
  if (!user?.is_admin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';

    const sql = getDb();
    const quotes = await queryAsArray`
      SELECT 
        qr.*,
        o.total_amount,
        o.created_at as order_created_at,
        o.delivery_quote_status
      FROM quote_requests qr
      JOIN orders o ON qr.order_id = o.id
      WHERE qr.status = ${status}
      ORDER BY qr.created_at DESC
    `;

    return NextResponse.json(quotes);
  } catch (err) {
    console.error('Failed to fetch quote requests:', err);
    return NextResponse.json({ error: 'Failed to fetch quote requests' }, { status: 500 });
  }
}
