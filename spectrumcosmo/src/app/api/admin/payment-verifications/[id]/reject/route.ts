import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id } = params;
    const { orderId, reason } = await req.json();

    const sql = getDb();

    // Update payment confirmation status
    await sql`
      UPDATE payment_confirmations
      SET status = 'rejected', reviewed_by = 1, reviewed_at = NOW(), rejection_reason = ${reason}
      WHERE id = ${id}
    `;

    // Update order payment status back to pending (allows resubmission)
    await sql`
      UPDATE orders
      SET payment_status = 'pending', proof_of_payment = NULL, payment_note = NULL
      WHERE id = ${orderId}
    `;

    // Get customer email
    const [order] = await sql`
      SELECT customer_email, customer_name FROM orders WHERE id = ${orderId}
    `;

    if (order?.customer_email) {
      await sendMail({
        to: order.customer_email,
        subject: 'Payment Update – SpectrumCosmo',
        text: `Hello ${order.customer_name},\n\nYour payment proof was not approved. Reason: ${reason}\n\nPlease upload a valid proof of payment.\n\nThank you.`,
        html: `
          <h2>Payment Update</h2>
          <p>Hello ${order.customer_name},</p>
          <p>Your payment proof was <strong>not approved</strong>.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>Please upload a valid proof of payment from your <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}/payment">payment page</a>.</p>
          <p>Thank you for shopping with SpectrumCosmo.</p>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Reject error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
