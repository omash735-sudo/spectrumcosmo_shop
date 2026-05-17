import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const sql = getDb();
    const verifications = await sql`
      SELECT 
        pc.id,
        pc.order_id,
        pc.proof_image_url,
        pc.transaction_reference,
        pc.notes,
        pc.submitted_at,
        pc.status,
        pc.rejection_reason,
        o.customer_name,
        o.phone_number,
        o.total_amount
      FROM payment_confirmations pc
      JOIN orders o ON o.id = pc.order_id
      ORDER BY pc.submitted_at DESC
    `;
    return NextResponse.json(verifications);
  } catch (err: any) {
    console.error('Verifications fetch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
