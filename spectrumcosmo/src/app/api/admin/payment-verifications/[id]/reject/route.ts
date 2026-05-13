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

    // Get customer details
    const [order] = await sql`
      SELECT customer_email, customer_name, total_amount FROM orders WHERE id = ${orderId}
    `;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

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

    const orderNumber = order.id.slice(-8);
    const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}/payment`;

    // Send rejection email
    const emailHtml = `
      <div style="font-family: Arial; max-width:600px; margin:auto; border:1px solid #ddd; border-radius:16px; overflow:hidden;">
        <div style="background:#dc2626; padding:20px; text-align:center;">
          <h1 style="color:white; margin:0;">Payment Update</h1>
        </div>
        <div style="padding:24px;">
          <p>Hello <strong>${order.customer_name}</strong>,</p>
          <p>Your payment proof for order <strong>#${orderNumber}</strong> could not be verified.</p>
          
          <div style="background:#fee2e2; padding:20px; border-radius:12px; margin:20px 0;">
            <h3 style="margin-top:0; color:#dc2626;">Reason for rejection:</h3>
            <p style="margin:0;">${reason}</p>
          </div>

          <p>Please upload a valid proof of payment using the link below.</p>

          <div style="text-align:center; margin:24px 0;">
            <a href="${paymentUrl}" style="display:inline-block; background:#F97316; color:white; padding:12px 28px; text-decoration:none; border-radius:30px; font-weight:bold;">Upload New Proof →</a>
          </div>
        </div>
        <div style="background:#f9fafb; padding:20px; text-align:center; font-size:12px; color:#6b7280;">
          <p>SpectrumCosmo – Wear your excitement with pride.</p>
        </div>
      </div>
    `;

    await sendMail({
      to: order.customer_email,
      subject: `Payment Update for Order #${orderNumber}`,
      text: `Hello ${order.customer_name},\n\nYour payment proof was rejected. Reason: ${reason}\n\nPlease upload a valid proof here: ${paymentUrl}`,
      html: emailHtml,
    }).catch(err => console.error('Rejection email failed:', err));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Reject error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
