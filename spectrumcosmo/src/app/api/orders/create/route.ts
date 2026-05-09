import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import { getVerifiedUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Check authenticated user – if frozen/banned, reject.
    const { user, error: authError } = await getVerifiedUser(req);
    if (authError && authError.status === 403) {
      return authError;
    }
    // user may be null (guest) or active user

    const body = await req.json();
    const {
      customer_name,
      customer_email,
      phone_number,
      location,
      notes,
      payment_method,
      items,
      total_amount,
      delivery_method_id,
      delivery_fee,
    } = body;

    if (!customer_name || !customer_email || !phone_number || !location || !items?.length || !total_amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const safeTotal = Number(total_amount);
    if (isNaN(safeTotal)) {
      return NextResponse.json({ error: 'Invalid total_amount' }, { status: 400 });
    }

    let safeDeliveryMethodId = delivery_method_id !== undefined && delivery_method_id !== null ? Number(delivery_method_id) : null;
    if (safeDeliveryMethodId !== null && isNaN(safeDeliveryMethodId)) {
      safeDeliveryMethodId = null;
    }

    let safeDeliveryFee = Number(delivery_fee);
    if (isNaN(safeDeliveryFee)) safeDeliveryFee = 0;

    const sql = getDb();

    const [order] = await sql`
      INSERT INTO orders (
        customer_name, customer_email, phone_number, delivery_address,
        payment_note, payment_method, total_amount, status, user_id, created_at,
        delivery_method_id, delivery_fee
      ) VALUES (
        ${customer_name}, ${customer_email}, ${phone_number}, ${location},
        ${notes || ''}, ${payment_method}, ${safeTotal}, 'pending',
        ${user?.id || null}, NOW(),
        ${safeDeliveryMethodId}, ${safeDeliveryFee}
      )
      RETURNING id::text
    `;

    if (!order || !order.id) throw new Error('Failed to create order');

    for (const item of items) {
      let unitPriceUsd = Number(item.price_usd);
      if (isNaN(unitPriceUsd)) unitPriceUsd = 0;
      const quantity = Number(item.quantity);
      if (isNaN(quantity)) continue;
      const subtotalUsd = quantity * unitPriceUsd;
      await sql`
        INSERT INTO order_items (
          order_id, product_name, quantity, unit_price_usd, subtotal_usd, custom_details
        ) VALUES (
          ${order.id}::uuid, ${item.name}, ${quantity}, ${unitPriceUsd}, ${subtotalUsd},
          ${item.custom_details || null}
        )
      `;
    }

    // Invoice email (unchanged)
    const orderItemsHtml = items.map(item => `
      <tr>
        <td style="padding:8px; border-bottom:1px solid #eee;">${item.name} x ${item.quantity}</td>
        <td style="padding:8px; border-bottom:1px solid #eee;">MWK ${(Number(item.price_usd) * Number(item.quantity)).toLocaleString()}</td>
      </tr>
    `).join('');

    const invoiceHtml = `
      <div style="font-family: Arial; max-width:600px; margin:auto; border:1px solid #ddd; border-radius:16px;">
        <div style="background:#F97316; padding:20px; text-align:center; color:white;">
          <h2>Order Confirmation</h2>
          <p>Order #${order.id.slice(-8)}</p>
        </div>
        <div style="padding:20px;">
          <p>Hi <strong>${customer_name}</strong>,</p>
          <p>Thank you for your order! Details below:</p>
          <table style="width:100%; border-collapse:collapse;">${orderItemsHtml}<table>
          <p><strong>Total Amount:</strong> MWK ${safeTotal.toLocaleString()}</p>
          <p><strong>Payment Method:</strong> ${payment_method}</p>
          <p><strong>Delivery Address:</strong> ${location}</p>
          <p><strong>Estimated Delivery:</strong> 3–5 business days after payment verification.</p>
          <hr />
          <p style="font-size:12px;">Questions? Reply to this email.</p>
        </div>
      </div>
    `;

    await sendMail({
      to: customer_email,
      subject: `Order Confirmation #${order.id.slice(-8)}`,
      text: `Your order total MWK ${safeTotal.toLocaleString()}. Track at ${process.env.NEXT_PUBLIC_APP_URL}/account/tracking?order=${order.id}`,
      html: invoiceHtml,
    }).catch(err => console.error('Email failed:', err));

    return NextResponse.json({
      success: true,
      id: order.id,
      total_amount: safeTotal,
    });
  } catch (err: any) {
    console.error('Order creation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
