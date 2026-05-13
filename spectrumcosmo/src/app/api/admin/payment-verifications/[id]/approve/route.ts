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
    const { orderId } = await req.json();

    const sql = getDb();

    // Update payment confirmation status
    await sql`
      UPDATE payment_confirmations
      SET status = 'approved', reviewed_by = 1, reviewed_at = NOW()
      WHERE id = ${id}
    `;

    // Update order status to approved and payment_status to paid
    await sql`
      UPDATE orders
      SET status = 'approved', payment_status = 'paid', payment_verified_at = NOW()
      WHERE id = ${orderId}
    `;

    // Get customer email
    const [order] = await sql`
      SELECT customer_email, customer_name FROM orders WHERE id = ${orderId}
    `;

    if (order?.customer_email) {
      await sendMail({
        to: order.customer_email,
        subject: 'Payment Approved – SpectrumCosmo',
        text: `Hello ${order.customer_name},\n\nYour payment has been approved. Your order will be processed and shipped soon.\n\nThank you for shopping with SpectrumCosmo.`,
        html: `
          <h2>Payment Approved!</h2>
          <p>Hello ${order.customer_name},</p>
          <p>Your payment has been <strong>approved</strong>. Your order will be processed and shipped soon.</p>
          <p>Thank you for shopping with SpectrumCosmo.</p>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Approve error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
