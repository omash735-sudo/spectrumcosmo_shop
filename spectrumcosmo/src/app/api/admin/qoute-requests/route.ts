// app/api/admin/quote-requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getVerifiedUser(req);
    if (error) return error;
    
    // Check if user exists
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!user.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';

    const sql = getDb();

    const quotes = await sql`
      SELECT 
        qr.id,
        qr.order_id,
        qr.customer_name,
        qr.customer_email,
        qr.customer_phone,
        qr.delivery_location,
        qr.requested_method,
        qr.admin_quote_fee,
        qr.admin_quote_notes,
        qr.status,
        qr.created_at,
        qr.responded_at,
        o.total_amount,
        o.created_at as order_created_at,
        o.delivery_quote_status
      FROM quote_requests qr
      LEFT JOIN orders o ON qr.order_id = o.id
      WHERE qr.status = ${status}
      ORDER BY qr.created_at DESC
    `;

    return NextResponse.json(quotes);
  } catch (err) {
    console.error('Failed to fetch quote requests:', err);
    return NextResponse.json(
      { error: 'Failed to fetch quote requests', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
