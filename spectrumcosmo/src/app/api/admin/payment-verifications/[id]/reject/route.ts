import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';
import { releaseReservedStock } from '@/lib/stock-manager';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id: verificationId } = await params;
    const { orderId, reason } = await req.json();
    const adminId = (authError as any)?.id || null;

    const sql = getDb();

    // Get order details
    const [order] = await sql`
      SELECT customer_email, customer_name, total_amount, status
      FROM orders 
      WHERE id = ${orderId}::uuid
    `;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Release reserved stock back to inventory
    if (order.status === 'pending') {
      await releaseReservedStock(orderId);
    }

    // Update payment verification status
    await sql`
      UPDATE payment_confirmations
      SET status = 'rejected', rejection_reason = ${reason}, reviewed_by = ${adminId}, reviewed_at = NOW()
      WHERE id = ${verificationId}
    `;

    // Optionally update order status to 'payment_issue'
    await sql`
      UPDATE orders
      SET status = 'payment_issue', admin_notes = CONCAT(COALESCE(admin_notes, ''), '\nPayment rejected: ', ${reason})
      WHERE id = ${orderId}::uuid
    `;

    // Send rejection email to customer
    if (order.customer_email) {
      await sendMail({
        to: order.customer_email,
        subject: `Payment Verification Issue - Order #${orderId.slice(-8)}`,
        text: `Hello ${order.customer_name},\n\nYour payment verification was rejected for the following reason:\n\n${reason}\n\nPlease upload a clear payment proof or contact support.\n\nSpectrumCosmo Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2>Payment Verification Issue</h2>
            <p>Hello ${order.customer_name},</p>
            <p>Your payment verification was rejected for the following reason:</p>
            <div style="background: #fee2e2; padding: 15px; border-radius: 8px; margin: 15px 0;">
              ${reason}
            </div>
            <p>Please upload a clear payment proof or contact support.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${orderId}" style="background: #F97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 30px;">View Order</a>
          </div>
        `,
      }).catch(err => console.error('Email failed:', err));
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Reject error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
