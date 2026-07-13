import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne, queryAsArray } from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import { getVerifiedUser } from '@/lib/auth';

function renderEmailTemplate(template: string, placeholders: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(placeholders)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

async function getEmailTemplate(sql: any, name: string) {
  const templates = await queryAsArray<{ html_template: string; subject: string }>`
    SELECT html_template, subject FROM email_templates 
    WHERE name = ${name} AND is_active = true 
    LIMIT 1
  `;
  return templates[0] || null;
}

export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await getVerifiedUser(req);
    if (authError && authError.status === 403) {
      return authError;
    }

    const body = await req.json();
    console.log('Order payload:', body);

    const {
      customer_name,
      customer_email,
      phone_number,
      location,
      notes,
      items,
      total_amount,
      delivery_method_id,
      delivery_method_name,
      custom_delivery_method,
      delivery_fee,
      payment_provider_id,
      payment_method,
      discount_amount,
      tax_amount,
      promo_code_id,
      promo_code,
      referral_code,
    } = body;

    if (!customer_name || !customer_email || !phone_number || !location || !items?.length || !total_amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const safeTotal = Number(total_amount);
    if (isNaN(safeTotal)) {
      return NextResponse.json({ error: 'Invalid total_amount' }, { status: 400 });
    }

    const sql = getDb();

    let isAutomatic = false;
    let paymentInstructions = '';
    if (payment_provider_id) {
      const provider = await queryOne<{
        type: string;
        instructions: string;
        name: string;
        account_name: string;
        account_number: string;
        branch: string;
      }>`
        SELECT type, instructions, name, account_name, account_number, branch 
        FROM payment_providers 
        WHERE id = ${payment_provider_id}
      `;
      isAutomatic = provider?.type === 'automatic';
      paymentInstructions = provider?.instructions || '';
      
      if (!isAutomatic && provider) {
        paymentInstructions = `
          <strong>${provider.name}</strong><br/>
          ${provider.account_name ? `Account Name: ${provider.account_name}<br/>` : ''}
          ${provider.account_number ? `Account Number: ${provider.account_number}<br/>` : ''}
          ${provider.branch ? `Branch: ${provider.branch}<br/>` : ''}
          ${provider.instructions || ''}
        `;
      }
    }

    const settingsRows = await queryAsArray<{ setting_key: string; setting_value: string }>`
      SELECT setting_key, setting_value FROM system_settings
    `;
    const settingsMap: Record<string, string> = {};
    settingsRows.forEach((s) => {
      settingsMap[s.setting_key] = s.setting_value;
    });

    const finalDeliveryMethod = custom_delivery_method || delivery_method_name || 'Standard';
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
    const orderNumber = Math.floor(100000 + Math.random() * 900000).toString();

    // Insert order without RETURNING to avoid type issues
    await sql`
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
        delivery_method_name,
        custom_delivery_method,
        delivery_fee, 
        payment_provider_id, 
        payment_status,
        promo_code,
        referral_code,
        discount_amount,
        tax_amount,
        expires_at,
        order_number
      ) VALUES (
        ${customer_name}, 
        ${customer_email}, 
        ${phone_number}, 
        ${location},
        ${notes || ''}, 
        ${payment_method}, 
        ${safeTotal}, 
        'pending',
        ${user?.id || null}, 
        ${now.toISOString()},
        ${delivery_method_id || null}, 
        ${finalDeliveryMethod},
        ${custom_delivery_method || null},
        ${delivery_fee || 0},
        ${payment_provider_id || null}, 
        ${isAutomatic ? 'paid' : 'pending'},
        ${promo_code || null},
        ${referral_code || null},
        ${discount_amount || 0},
        ${tax_amount || 0},
        ${expiresAt.toISOString()},
        ${orderNumber}
      )
    `;

    // Get the inserted order ID
    const orderResult = await queryOne<{ id: string }>`
      SELECT id::text FROM orders 
      WHERE order_number = ${orderNumber} 
      LIMIT 1
    `;

    if (!orderResult || !orderResult.id) {
      throw new Error('Failed to retrieve created order');
    }

    const orderId = orderResult.id;

    // Insert order items
    for (const item of items) {
      let unitPriceUsd = Number(item.price_usd);
      if (isNaN(unitPriceUsd)) unitPriceUsd = 0;
      const quantity = Number(item.quantity);
      if (isNaN(quantity)) continue;
      const subtotalUsd = quantity * unitPriceUsd;
      const productName = item.product_name || item.name || 'Product';
      
      await sql`
        INSERT INTO order_items (
          order_id, product_name, quantity, unit_price_usd, subtotal_usd, custom_details
        ) VALUES (
          ${orderId}::uuid, ${productName}, ${quantity}, ${unitPriceUsd}, ${subtotalUsd},
          ${item.custom_details || null}
        )
      `;
    }

    const orderItemsHtml = items.map((item: any) => `
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
        <span>${item.name} x ${item.quantity}</span>
        <span>MWK ${(Number(item.price_usd) * Number(item.quantity)).toLocaleString()}</span>
      </div>
    `).join('');

    const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/payment?orderId=${orderId}`;
    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/account/orders`;

    const commonPlaceholders = {
      customer_name,
      order_number: orderNumber,
      total_amount: safeTotal.toLocaleString(),
      delivery_address: location,
      delivery_method: finalDeliveryMethod,
      payment_instructions: paymentInstructions,
      payment_url: paymentUrl,
      tracking_url: trackingUrl,
    };

    if (isAutomatic) {
      let emailTemplate = await getEmailTemplate(sql, 'order_confirmation_automatic');
      
      if (emailTemplate) {
        const html = renderEmailTemplate(emailTemplate.html_template, commonPlaceholders);
        await sendMail({
          to: customer_email,
          subject: renderEmailTemplate(emailTemplate.subject, commonPlaceholders),
          text: `Your order #${orderNumber} has been confirmed. Total: MWK ${safeTotal.toLocaleString()}`,
          html,
        }).catch(err => console.error('Email failed:', err));
      } else {
        const fallbackHtml = `
          <div style="font-family: Arial; max-width:600px;">
            <h2>Order Confirmed</h2>
            <p>Hello ${customer_name},</p>
            <p>Thank you for your order! Your payment has been processed successfully.</p>
            <div style="background:#f9fafb; padding:20px; border-radius:12px;">
              <h3>Order Summary</h3>
              <p><strong>Order #:</strong> ${orderNumber}</p>
              <p><strong>Total Amount:</strong> MWK ${safeTotal.toLocaleString()}</p>
              <p><strong>Delivery Method:</strong> ${finalDeliveryMethod}</p>
              <p><strong>Delivery Address:</strong> ${location}</p>
            </div>
            <a href="${trackingUrl}" style="background:#F97316; color:white; padding:12px 28px; text-decoration:none; border-radius:30px;">View Order →</a>
          </div>
        `;
        await sendMail({
          to: customer_email,
          subject: `Order Confirmation #${orderNumber}`,
          text: `Your order #${orderNumber} has been confirmed. Total: MWK ${safeTotal.toLocaleString()}`,
          html: fallbackHtml,
        }).catch(err => console.error('Email failed:', err));
      }
    } else {
      let emailTemplate = await getEmailTemplate(sql, 'payment_instructions');
      
      const activeBanner = await queryOne<{
        title: string;
        description: string;
        discount_code: string;
        button_text: string;
        button_url: string;
      }>`
        SELECT title, description, discount_code, button_text, button_url 
        FROM promotional_banners 
        WHERE is_active = true 
          AND (starts_at IS NULL OR starts_at <= NOW()) 
          AND (ends_at IS NULL OR ends_at >= NOW())
        LIMIT 1
      `;

      const discountBannerHtml = activeBanner ? `
        <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <p style="margin:0; font-size:14px; color:#92400E;">${activeBanner.title || 'Special Offer'}</p>
          ${activeBanner.description ? `<p style="margin:5px 0 0; font-size:12px;">${activeBanner.description}</p>` : ''}
          ${activeBanner.discount_code ? `<p style="margin:10px 0 0; font-weight:bold;">Code: ${activeBanner.discount_code}</p>` : ''}
          ${activeBanner.button_text && activeBanner.button_url ? `<a href="${activeBanner.button_url}" style="display:inline-block; margin-top:10px; background:#F97316; color:white; padding:8px 20px; text-decoration:none; border-radius:30px;">${activeBanner.button_text}</a>` : ''}
        </div>
      ` : (settingsMap.discount_banner_default ? `
        <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <p style="margin:0;">${settingsMap.discount_banner_default}</p>
        </div>
      ` : '');

      if (emailTemplate) {
        const html = renderEmailTemplate(emailTemplate.html_template, {
          ...commonPlaceholders,
          discount_banner: discountBannerHtml,
        });
        await sendMail({
          to: customer_email,
          subject: renderEmailTemplate(emailTemplate.subject, commonPlaceholders),
          text: `Hello ${customer_name},\n\nPlease complete your payment here: ${paymentUrl}`,
          html,
        }).catch(err => console.error('Email failed:', err));
      } else {
        const orderItemsTable = items.map((item: any) => `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span>${item.name} x ${item.quantity}</span>
            <span>MWK ${(Number(item.price_usd) * Number(item.quantity)).toLocaleString()}</span>
          </div>
        `).join('');

        const fallbackHtml = `
          <div style="font-family: Arial; max-width:600px; margin:auto; border:1px solid #ddd; border-radius:16px; overflow:hidden;">
            <div style="background:#F97316; padding:20px; text-align:center;">
              <img src="${settingsMap.invoice_logo_url || 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png'}" style="max-width:150px;" />
              <h1 style="color:white; margin:10px 0 0;">Complete Your Payment</h1>
            </div>
            <div style="padding:24px;">
              <p>Hello <strong>${customer_name}</strong>,</p>
              <p>Thank you for your order! To complete your purchase, please follow the instructions below.</p>
              
              <div style="background:#f9fafb; padding:20px; border-radius:12px; margin:20px 0;">
                <h3 style="margin-top:0;">Order Summary</h3>
                ${orderItemsTable}
                <div style="display: flex; justify-content: space-between; padding: 12px 0; font-weight: bold; font-size: 18px; color: #F97316;">
                  <span>Total Amount</span>
                  <span>MWK ${safeTotal.toLocaleString()}</span>
                </div>
              </div>

              <div style="background:#fef3c7; padding:20px; border-radius:12px; margin:20px 0;">
                <h3 style="margin-top:0;">Payment Instructions</h3>
                <div style="font-size:14px;">${paymentInstructions}</div>
              </div>

              <div style="text-align:center;">
                <a href="${paymentUrl}" style="display:inline-block; background:#F97316; color:white; padding:12px 28px; text-decoration:none; border-radius:30px; font-weight:bold;">Complete Payment →</a>
              </div>

              ${discountBannerHtml}
            </div>
            <div style="background:#f9fafb; padding:20px; text-align:center; font-size:12px; color:#6b7280; border-top:1px solid #e5e7eb;">
              <p>${settingsMap.company_name || 'SpectrumCosmo'} – Wear your excitement with pride.</p>
              <p>${settingsMap.company_address || 'Lilongwe, Malawi'} | <a href="mailto:${settingsMap.company_email || 'hello@spectrumcosmo.shop'}" style="color:#F97316;">${settingsMap.company_email || 'hello@spectrumcosmo.shop'}</a></p>
              <p>© ${new Date().getFullYear()} ${settingsMap.company_name || 'SpectrumCosmo'}. ${settingsMap.footer_copyright || 'All rights reserved.'}</p>
            </div>
          </div>
        `;
        
        await sendMail({
          to: customer_email,
          subject: `Complete Your Payment for Order #${orderNumber}`,
          text: `Hello ${customer_name},\n\nPlease complete your payment here: ${paymentUrl}`,
          html: fallbackHtml,
        }).catch(err => console.error('Email failed:', err));
      }
    }

    return NextResponse.json({
      success: true,
      id: orderId,
      total_amount: safeTotal,
    });
  } catch (err) {
    console.error('Order creation error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
