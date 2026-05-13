import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    const { proofImageUrl, transactionReference, notes } = await req.json();

    if (!proofImageUrl) {
      return NextResponse.json({ error: 'Proof image is required' }, { status: 400 });
    }

    const sql = getDb();

    // Update order with proof and change status to awaiting_verification
    await sql`
      UPDATE orders 
      SET 
        proof_of_payment = ${proofImageUrl},
        payment_note = ${notes || null},
        payment_status = 'awaiting_verification'
      WHERE id::text = ${orderId}
    `;

    // Insert payment confirmation record
    await sql`
      INSERT INTO payment_confirmations (order_id, proof_image_url, transaction_reference, notes)
      VALUES (${orderId}, ${proofImageUrl}, ${transactionReference || null}, ${notes || null})
    `;

    return NextResponse.json({ success: true, message: 'Payment proof submitted. Admin will verify shortly.' });
  } catch (err: any) {
    console.error('Payment confirmation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
