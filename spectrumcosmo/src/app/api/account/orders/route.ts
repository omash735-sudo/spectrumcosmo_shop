import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  try {
    const sql = getDb();
    
    const orders = await sql`
      SELECT 
        id,
        order_number,
        customer_name,
        customer_email,
        phone_number,
        delivery_address,
        total_amount,
        status,
        payment_method,
        payment_status,
        proof_of_payment_url,
        payment_note,
        delivery_method_id,
        delivery_fee,
        created_at,
        updated_at
      FROM orders
      WHERE user_id = ${user.id} OR customer_email = ${user.email}
      ORDER BY created_at DESC
    `;
    
    return NextResponse.json(orders);
  } catch (err: any) {
    console.error('Failed to fetch user orders:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH for cancelling orders
export async function PATCH(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const action = url.searchParams.get('action');

  if (id && action === 'cancel') {
    try {
      const sql = getDb();

      const [order] = await sql`
        SELECT status, order_number FROM orders 
        WHERE id = ${id} AND (user_id = ${user.id} OR customer_email = ${user.email})
      `;
      
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      if (order.status !== 'pending') {
        return NextResponse.json({ error: 'Only pending orders can be cancelled' }, { status: 400 });
      }

      await sql`
        UPDATE orders 
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = ${id} AND (user_id = ${user.id} OR customer_email = ${user.email})
      `;

      return NextResponse.json({ success: true, message: 'Order cancelled successfully' });
    } catch (err: any) {
      console.error('Failed to cancel order:', err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}

// POST for uploading payment proof (with transaction reference)
export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  try {
    const body = await req.json();
    console.log('Received POST body:', body);
    
    const { id, proofOfPaymentUrl, paymentNote, transactionReference } = body;
    
    if (!id || !proofOfPaymentUrl) {
      return NextResponse.json(
        { error: 'Order ID and proof image URL are required' },
        { status: 400 }
      );
    }

    const sql = getDb();

    // Check if order exists and belongs to user
    const [existingOrder] = await sql`
      SELECT id, status, payment_status, customer_name, total_amount 
      FROM orders 
      WHERE id = ${id} AND (user_id = ${user.id} OR customer_email = ${user.email})
    `;

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (existingOrder.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending orders can be updated' }, { status: 400 });
    }

    // Combine payment note with transaction reference
    const fullNote = transactionReference 
      ? `Transaction Ref: ${transactionReference}\n${paymentNote || ''}`.trim()
      : paymentNote || '';

    // Update the order with proof
    const [updatedOrder] = await sql`
      UPDATE orders
      SET 
        proof_of_payment_url = ${proofOfPaymentUrl},
        payment_note = ${fullNote},
        payment_status = 'awaiting_verification',
        status = 'awaiting_verification',
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    // Send notification email to admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      await sendMail({
        to: adminEmail,
        subject: `Payment Proof Uploaded - Order ${id.slice(-8)}`,
        text: `A customer has uploaded payment proof for order ${id.slice(-8)}.\n\nCustomer: ${existingOrder.customer_name}\nAmount: MWK ${existingOrder.total_amount}\n${transactionReference ? `Transaction Ref: ${transactionReference}\n` : ''}${paymentNote ? `Note: ${paymentNote}\n` : ''}\n\nView proof: ${proofOfPaymentUrl}`,
        html: `
          <h2>Payment Proof Uploaded</h2>
          <p><strong>Order:</strong> ${id.slice(-8)}</p>
          <p><strong>Customer:</strong> ${existingOrder.customer_name}</p>
          <p><strong>Amount:</strong> MWK ${existingOrder.total_amount}</p>
          ${transactionReference ? `<p><strong>Transaction Reference:</strong> ${transactionReference}</p>` : ''}
          ${paymentNote ? `<p><strong>Customer Note:</strong> ${paymentNote}</p>` : ''}
          <p><strong>Proof Image:</strong> <a href="${proofOfPaymentUrl}" target="_blank">View Image</a></p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders">Review Order</a></p>
        `,
      }).catch(err => console.error('Admin email failed:', err));
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Payment proof submitted successfully',
      order: updatedOrder 
    });
  } catch (err: any) {
    console.error('Failed to upload proof:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
