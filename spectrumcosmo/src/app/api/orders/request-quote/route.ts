import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne, queryAsArray } from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import { getVerifiedUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await getVerifiedUser(req);
    
    const body = await req.json();
    const {
      customer_name,
      customer_email,
      phone_number,
      location,
      notes,
      items,
      delivery_method_id,
      delivery_method_name,
      payment_provider_id,
      payment_method,
      subtotal,
    } = body;

    // Validation
    if (!customer_name || !customer_email || !phone_number || !location || !items?.length || !subtotal) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sql = getDb();

    // Calculate total (products only - no delivery fee)
    const totalAmount = Number(subtotal);

    // Create order with quote requested status
    const order = await queryOne<{ id: string }>`
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
        created_at,
        delivery_method_id,
        payment_provider_id,
        payment_status,
        delivery_quote_status,
        quote_requested_at
      ) VALUES (
        ${customer_name}, 
        ${customer_email}, 
        ${phone_number}, 
        ${location},
        ${notes || ''}, 
        ${payment_method}, 
        ${totalAmount}, 
        'pending_quote',
        ${user?.id || null}, 
        NOW(),
        ${delivery_method_id || null},
        ${payment_provider_id || null},
        'pending_products',
        'pending',
        NOW()
      )
      RETURNING id::text
    `;

    if (!order || !order.id) {
      throw new Error('Failed to create order');
    }

    // Insert order items
    for (const item of items) {
      const unitPriceUsd = Number(item.price_usd) || 0;
      const quantity = Number(item.quantity);
      const subtotalUsd = quantity * unitPriceUsd;
      const productName = item.product_name || item.name || 'Product';
      
      await sql`
        INSERT INTO order_items (
          order_id, product_name, quantity, unit_price_usd, subtotal_usd, custom_details
        ) VALUES (
          ${order.id}::uuid, ${productName}, ${quantity}, ${unitPriceUsd}, ${subtotalUsd},
          ${item.custom_details || null}
        )
      `;
    }

    // Create quote request record
    await sql`
      INSERT INTO quote_requests (
        order_id, customer_name, customer_email, customer_phone,
        delivery_location, requested_method, status
      ) VALUES (
        ${order.id}::uuid, ${customer_name}, ${customer_email}, ${phone_number},
        ${location}, ${delivery_method_name}, 'pending'
      )
    `;

    // Send confirmation email to customer
    const orderNumber = order.id.slice(-8);
    const customerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <div style="background: #F97316; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">Quote Request Received</h1>
        </div>
        <div style="padding: 24px;">
          <p>Hello <strong>${customer_name}</strong>,</p>
          <p>Thank you for your order! Since your delivery location requires special handling, we have created a quote request.</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Summary</h3>
            <p><strong>Order #:</strong> ${orderNumber}</p>
            <p><strong>Products Total:</strong> MWK ${totalAmount.toLocaleString()}</p>
            <p><strong>Delivery Location:</strong> ${location}</p>
            <p><strong>Requested Method:</strong> ${delivery_method_name}</p>
          </div>

          <div style="background: #fef3c7; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h3 style="margin-top: 0;">📦 What Happens Next?</h3>
            <ol style="margin: 0; padding-left: 20px;">
              <li>Our team will review your delivery location within 24 hours</li>
              <li>We'll calculate the exact delivery fee for your area</li>
              <li>You'll receive an email with the delivery fee quote</li>
              <li>Once you approve and pay the delivery fee, your order will be shipped</li>
            </ol>
          </div>

          <p style="color: #6b7280; font-size: 14px;">You have not been charged for delivery yet. You will only pay for delivery after receiving our quote.</p>
          
          <hr style="margin: 24px 0;" />
          <p style="font-size: 12px; color: #999;">SpectrumCosmo - Wear your excitement with pride.</p>
        </div>
      </div>
    `;

    await sendMail({
      to: customer_email,
      subject: `Quote Request Received - Order #${orderNumber}`,
      text: `Your quote request has been received. We'll contact you within 24 hours with delivery fee.`,
      html: customerEmailHtml,
    }).catch(err => console.error('Email failed:', err));

    // Send notification to admin
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif;">
        <h2>New Quote Request</h2>
        <p><strong>Order #:</strong> ${orderNumber}</p>
        <p><strong>Customer:</strong> ${customer_name}</p>
        <p><strong>Email:</strong> ${customer_email}</p>
        <p><strong>Phone:</strong> ${phone_number}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Requested Method:</strong> ${delivery_method_name}</p>
        <p><strong>Products Total:</strong> MWK ${totalAmount.toLocaleString()}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/delivery-quotes" style="background: #F97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px;">Review Quote Request</a>
      </div>
    `;

    await sendMail({
      to: process.env.ADMIN_EMAIL || 'admin@spectrumcosmo.shop',
      subject: `New Delivery Quote Request - Order #${orderNumber}`,
      text: `A new quote request needs your attention. Order #${orderNumber}`,
      html: adminEmailHtml,
    }).catch(err => console.error('Admin email failed:', err));

    return NextResponse.json({
      success: true,
      orderId: order.id,
      requiresQuote: true,
      message: 'Quote request submitted. You will receive delivery fee quote within 24 hours.',
    });
  } catch (err) {
    console.error('Quote request error:', err);
    return NextResponse.json(
      { error: 'Failed to create quote request' },
      { status: 500 }
    );
  }
}
