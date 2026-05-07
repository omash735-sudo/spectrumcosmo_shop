import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserFromRequest } from '@/lib/userAuth';
import { sendMail } from '@/lib/mailer'; // import the mailer

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    const body = await req.json();

    const {
      customer_name,
      customer_email,      // added
      phone_number,
      location,
      notes,
      payment_method,
      items,
      total_amount,
    } = body;

    // Validation – include customer_email
    if (!customer_name || !customer_email || !phone_number || !location || !items?.length || !total_amount) {
      return NextResponse.json({ error: 'Missing required fields (name, email, phone, location, items, total)' }, { status: 400 });
    }

    const sql = getDb();

    // 1. Insert order (add customer_email column if you have one; if not, store in payment_note or add to schema)
    // Assuming your orders table has a `customer_email` column. If not, run:
    // ALTER TABLE orders ADD COLUMN customer_email TEXT;
    const [order] = await sql`
      INSERT INTO orders (
        customer_name,
        customer_email,
        phone_number,
        delivery_address,
        payment_note,
        payment_method,
        total_amount,
        status,
        user_id,
        created_at
      ) VALUES (
        ${customer_name},
        ${customer_email},
        ${phone_number},
        ${location},
        ${notes || ''},
        ${payment_method},
        ${total_amount},
        'pending',
        ${user?.id || null},
        NOW()
      )
      RETURNING id::text
    `;

    if (!order || !order.id) throw new Error('Failed to create order');

    // 2. Insert order items
    for (const item of items) {
      let unitPriceUsd = item.price_usd ?? item.price ?? 0;
      if (isNaN(unitPriceUsd)) unitPriceUsd = 0;
      const subtotalUsd = item.quantity * unitPriceUsd;

      await sql`
        INSERT INTO order_items (
          order_id,
          product_name,
          quantity,
          unit_price_usd,
          subtotal_usd,
          custom_details
        ) VALUES (
          ${order.id}::uuid,
          ${item.name},
          ${item.quantity},
          ${unitPriceUsd},
          ${subtotalUsd},
          ${item.custom_details || null}
        )
      `;
    }

    // 3. Send invoice email
    const orderItemsHtml = items.map(item => `
      <tr>
        <td style="padding:8px; border-bottom:1px solid #eee;">${item.name} x ${item.quantity}</td>
        <td style="padding:8px; border-bottom:1px solid #eee;">MWK ${(item.price * item.quantity).toLocaleString()}</td>
      </tr>
    `).join('');

    const invoiceHtml = `
      <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; border:1px solid #ddd; border-radius:16px; overflow:hidden;">
        <div style="background:#F97316; padding:20px; text-align:center; color:white;">
          <h2>Order Confirmation</h2>
          <p>Order #${order.id.slice(-8)}</p>
        </div>
        <div style="padding:20px;">
          <p>Hi <strong>${customer_name}</strong>,</p>
          <p>Thank you for your order! Here are the details:</p>
          <table style="width:100%; border-collapse: collapse;">
            <thead>
              <tr><th>Item</th><th>Total</th></tr>
            </thead>
            <tbody>${orderItemsHtml}</tbody>
          </table>
          <p><strong>Total Amount:</strong> MWK ${total_amount.toLocaleString()}</p>
          <p><strong>Payment Method:</strong> ${payment_method}</p>
          <p><strong>Delivery Address:</strong> ${location}</p>
          <p><strong>Estimated Delivery:</strong> 3–5 business days after payment verification.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/account/tracking?order=${order.id}" style="background:#F97316; color:white; padding:8px 16px; text-decoration:none; border-radius:30px;">Track your order →</a></p>
          <hr />
          <p style="font-size:12px;">If you have any questions, reply to this email or contact support.</p>
        </div>
      </div>
    `;

    await sendMail({
      to: customer_email,
      subject: `Order Confirmation #${order.id.slice(-8)}`,
      text: `Your order total is MWK ${total_amount.toLocaleString()}. Track at ${process.env.NEXT_PUBLIC_APP_URL}/account/tracking?order=${order.id}`,
      html: invoiceHtml,
    }).catch(err => console.error('Invoice email failed:', err));

    // Optionally also send to admin? Not required now.

    return NextResponse.json({
      success: true,
      id: order.id,
      total_amount,
    });
  } catch (err: any) {
    console.error('Order creation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
