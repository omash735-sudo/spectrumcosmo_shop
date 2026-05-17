import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    const sql = getDb();

    await sql`
      UPDATE orders 
      SET proof_of_payment = NULL, payment_note = NULL, payment_status = 'pending'
      WHERE id = ${orderId}
    `;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Cancel proof error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
