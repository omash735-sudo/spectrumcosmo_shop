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
        currency,
        mwk_amount,
        checkout_currency,
        checkout_amount,
        expected_mwk_amount,
        actual_mwk_amount,
        exchange_rate_used,
        status, 
        payment_method, 
        payment_status,
        proof_of_payment_url, 
        payment_note, 
        delivery_method,
        custom_delivery_method,
        discount_amount,
        promo_code,
        referral_code,
        tracking_number,
        tracking_notes,
        admin_notes,
        created_at, 
        updated_at,
        delivered_at,
        paid_at,
        expires_at,
        invoice_number
      FROM orders
      WHERE user_id = ${user.id} 
         OR customer_email = ${user.email}
      ORDER BY created_at DESC
    `;
    
    const ordersWithItems = await Promise.all(
      orders.map(async (order: any) => {
        const items = await sql`
          SELECT 
            id,
            product_name,
            quantity,
            unit_price_usd as unit_price,
            subtotal_usd as total_price,
            custom_details,
            created_at
          FROM order_items
          WHERE order_id = ${order.id}::uuid
        `;
        return {
          ...order,
          // Use checkout fields for display (what customer sees)
          currency: order.checkout_currency || order.currency || 'MWK',
          total_amount: order.checkout_amount || order.total_amount || 0,
          // Keep original for reference
          _original_currency: order.currency,
          _original_amount: order.total_amount,
          _mwk_amount: order.mwk_amount,
          items: items || [],
          subtotal: order.total_amount || 0,
          shipping_cost: 0,
        };
      })
    );

    return NextResponse.json(ordersWithItems);
  } catch (err: any) {
    console.error('GET orders error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  console.log('=== PATCH REQUEST RECEIVED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  const action = url.searchParams.get('action');

  console.log('Query params:', { id, action });

  if (id && action === 'cancel') {
    try {
      const sql = getDb();
      const [order] = await sql`
        SELECT status, order_number FROM orders 
        WHERE id = ${id}::uuid AND (user_id = ${user.id} OR customer_email = ${user.email})
      `;

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      if (order.status !== 'pending') {
        return NextResponse.json({ error: 'Only pending orders can be cancelled' }, { status: 400 });
      }

      await sql`
        UPDATE orders SET status = 'cancelled', updated_at = NOW()
        WHERE id = ${id}::uuid AND (user_id = ${user.id} OR customer_email = ${user.email})
      `;

      return NextResponse.json({ success: true, message: 'Order cancelled successfully' });
    } catch (err: any) {
      console.error('Cancel error:', err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  console.log('Invalid PATCH request - missing cancel action');
  return NextResponse.json({ 
    error: 'Invalid request. Use POST for proof upload or PATCH with action=cancel for cancellation.' 
  }, { status: 400 });
}

export async function POST(req: NextRequest) {
  console.log('=== POST REQUEST RECEIVED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  try {
    const rawBody = await req.text();
    console.log('Raw request body:', rawBody);

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    console.log('Parsed body:', JSON.stringify(body, null, 2));

    const { id, proofOfPaymentUrl, paymentNote, transactionReference } = body;

    console.log('Extracted fields:', { id, proofOfPaymentUrl, paymentNote, transactionReference });

    if (!id) {
      console.log('Missing order ID');
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    if (!proofOfPaymentUrl) {
      console.log('Missing proof image URL');
      return NextResponse.json({ error: 'Proof image URL is required' }, { status: 400 });
    }

    const sql = getDb();

    console.log('Checking order existence for ID:', id);
    const [existingOrder] = await sql`
      SELECT id, status, payment_status, customer_name, total_amount, customer_email, currency, mwk_amount, checkout_currency, checkout_amount
      FROM orders 
      WHERE id = ${id}::uuid AND (user_id = ${user.id} OR customer_email = ${user.email})
    `;

    if (!existingOrder) {
      console.log('Order not found for ID:', id);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log('Order found:', { 
      id: existingOrder.id, 
      status: existingOrder.status, 
      payment_status: existingOrder.payment_status,
      currency: existingOrder.currency,
      total_amount: existingOrder.total_amount,
      checkout_currency: existingOrder.checkout_currency,
      checkout_amount: existingOrder.checkout_amount,
      mwk_amount: existingOrder.mwk_amount
    });

    if (existingOrder.status !== 'pending') {
      console.log('Order status not pending:', existingOrder.status);
      return NextResponse.json({ error: 'Only pending orders can be updated' }, { status: 400 });
    }

    const fullNote = transactionReference
      ? `Transaction Ref: ${transactionReference}\n${paymentNote || ''}`.trim()
      : paymentNote || '';

    console.log('Updating order with proof...');
    const [updatedOrder] = await sql`
      UPDATE orders
      SET 
        proof_of_payment_url = ${proofOfPaymentUrl},
        payment_note = ${fullNote},
        payment_status = 'awaiting_verification',
        status = 'awaiting_verification',
        updated_at = NOW()
      WHERE id = ${id}::uuid
      RETURNING *
    `;

    console.log('Order updated successfully:', updatedOrder ? 'Yes' : 'No');

    try {
      await sql`
        INSERT INTO payment_confirmations (
          order_id, proof_image_url, transaction_reference, notes, status, submitted_at
        ) VALUES (
          ${id}::uuid, ${proofOfPaymentUrl}, ${transactionReference || null}, ${paymentNote || null}, 'pending', NOW()
        )
      `;
      console.log('Payment confirmation record inserted.');
    } catch (pcErr) {
      console.error('Failed to insert into payment_confirmations:', pcErr);
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      const displayCurrency = existingOrder.checkout_currency || existingOrder.currency || 'MWK';
      const displayAmount = existingOrder.checkout_amount || existingOrder.total_amount || 0;
      
      await sendMail({
        to: adminEmail,
        subject: `Payment Proof Uploaded - Order ${id.slice(-8)}`,
        text: `Customer: ${existingOrder.customer_name}
Amount: ${displayCurrency} ${displayAmount}
MWK Amount: MWK ${existingOrder.mwk_amount || existingOrder.total_amount || 0}
Transaction Ref: ${transactionReference || 'N/A'}
Proof: ${proofOfPaymentUrl}`,
      }).catch(err => console.error('Admin email failed:', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Payment proof submitted successfully',
      order: updatedOrder,
    });
  } catch (err: any) {
    console.error('POST error details:', err);
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
