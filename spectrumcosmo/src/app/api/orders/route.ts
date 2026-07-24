// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne, queryAsArray } from '@/lib/db';
import { sendMail } from '@/lib/mailer';
import { getVerifiedUser } from '@/lib/auth';
import crypto from 'crypto';

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
      custom_delivery_method,
      delivery_fee,
      payment_provider_id,
      payment_method,
      discount_amount,
      tax_amount,
      promo_code,
      referral_code,
    } = body;

    if (!customer_name || !customer_email || !phone_number || !location || !items?.length || !total_amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!custom_delivery_method || !custom_delivery_method.trim()) {
      return NextResponse.json({ error: 'Preferred courier is required' }, { status: 400 });
    }

    const safeTotal = Number(total_amount);
    if (isNaN(safeTotal)) {
      return NextResponse.json({ error: 'Invalid total_amount' }, { status: 400 });
    }

    const sql = getDb();

    const deductedItems: { product_id: string; quantity: number }[] = [];
    let stockError: string | null = null;

    for (const item of items) {
      const quantity = Number(item.quantity);
      if (isNaN(quantity) || quantity <= 0) continue;

      const productId = item.product_id || item.id;
      if (!productId) {
        stockError = `Missing product reference for "${item.name || item.product_name || 'an item'}"`;
        break;
      }

      const result = await queryAsArray<{ id: string }>`
        UPDATE products
        SET stock_quantity = stock_quantity - ${quantity}
        WHERE id = ${productId} AND stock_quantity >= ${quantity}
        RETURNING id
      `;

      if (result.length === 0) {
        stockError = `"${item.name || item.product_name || 'This item'}" is no longer available in the quantity you requested.`;
        break;
      }

      deductedItems.push({ product_id: productId, quantity });
    }

    if (stockError) {
      for (const deducted of deductedItems) {
        await sql`
          UPDATE products 
          SET stock_quantity = stock_quantity + ${deducted.quantity}
          WHERE id = ${deducted.product_id}
        `;
      }
      return NextResponse.json({ error: stockError }, { status: 409 });
    }

    const orderId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000);
    const orderNumber = Math.floor(100000 + Math.random() * 900000).toString();

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

    try {
      await (sql as any).transaction((tx: any) => {
        const statements = [
          tx`
            INSERT INTO orders (
              id,
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
              custom_delivery_method,
              delivery_fee, 
              payment_provider_id, 
              payment_status,
              promo_code,
              referral_code,
              discount_amount,
              tax_amount,
              expires_at,
              order_number,
              stock_deducted
            ) VALUES (
              ${orderId}::uuid,
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
              ${custom_delivery_method},
              ${delivery_fee || 0},
              ${payment_provider_id || null}, 
              ${isAutomatic ? 'paid' : 'pending'},
              ${promo_code || null},
              ${referral_code || null},
              ${discount_amount || 0},
              ${tax_amount || 0},
              ${expiresAt.toISOString()},
              ${orderNumber},
              true
            )
          `,
        ];

        for (const item of items) {
          let unitPriceUsd = Number(item.price_usd);
          if (isNaN(unitPriceUsd)) unitPriceUsd = 0;
          const quantity = Number(item.quantity);
          if (isNaN(quantity)) continue;
          const subtotalUsd = quantity * unitPriceUsd;
          const productName = item.product_name || item.name || 'Product';

          statements.push(
            tx`
              INSERT INTO order_items (
                order_id, product_name, quantity, unit_price_usd, subtotal_usd, custom_details
              ) VALUES (
                ${orderId}::uuid, ${productName}, ${quantity}, ${unitPriceUsd}, ${subtotalUsd},
                ${item.custom_details || null}
              )
            `
          );
        }

        return statements;
      });
    } catch (txErr) {
      console.error('Order transaction failed, releasing reserved stock:', txErr);
      for (const deducted of deductedItems) {
        await sql`
          UPDATE products 
          SET stock_quantity = stock_quantity + ${deducted.quantity}
          WHERE id = ${deducted.product_id}
        `;
      }
      throw txErr;
    }

    const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/payment?orderId=${orderId}`;
    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/account/orders`;

    const commonPlaceholders = {
      customer_name,
      order_number: orderNumber,
      total_amount: safeTotal.toLocaleString(),
      delivery_address: location,
      delivery_method: custom_delivery_method,
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
        const html = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 20px; overflow: hidden;">
            <div style="background: #F97316; padding: 24px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed!</h1>
            </div>
            <div style="padding: 24px; background: white;">
              <p style="font-size: 16px; color: #333;">Hi <strong>${customer_name}</strong>,</p>
              <p style="font-size: 15px; line-height: 1.5; color: #555;">Thank you for your order! Your payment has been processed successfully.</p>
              <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin: 24px 0;">
                <p style="margin: 0 0 8px;"><strong>Order #:</strong> ${orderNumber}</p>
                <p style="margin: 0 0 8px;"><strong>Total:</strong> MWK ${safeTotal.toLocaleString()}</p>
                <p style="margin: 0 0 8px;"><strong>Delivery Method:</strong> ${custom_delivery_method}</p>
                <p style="margin: 0;"><strong>Delivery Address:</strong> ${location}</p>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${trackingUrl}" style="background: #F97316; color: white; padding: 12px 28px; text-decoration: none; border-radius: 40px; font-weight: bold; display: inline-block;">View Your Order</a>
              </div>
              <hr style="margin: 30px 0 20px; border: none; border-top: 1px solid #eee;" />
              <p style="font-size: 12px; color: #999;">Questions? Just reply to this email – we're here to help.<br/>SpectrumCosmo Team – Wear your excitement with pride.</p>
            </div>
          </div>
        `;
        await sendMail({
          to: customer_email,
          subject: `Order Confirmation #${orderNumber} – SpectrumCosmo`,
          text: `Your order #${orderNumber} has been confirmed. Total: MWK ${safeTotal.toLocaleString()}. Track your order: ${trackingUrl}`,
          html,
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
        const orderItemsHtml = items.map((item: any) => `
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
            <span>${item.name} x ${item.quantity}</span>
            <span>MWK ${(Number(item.price_usd) * Number(item.quantity)).toLocaleString()}</span>
          </div>
        `).join('');

        const html = `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 20px; overflow: hidden;">
            <div style="background: #F97316; padding: 24px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Complete Your Payment</h1>
            </div>
            <div style="padding: 24px; background: white;">
              <p style="font-size: 16px; color: #333;">Hi <strong>${customer_name}</strong>,</p>
              <p style="font-size: 15px; line-height: 1.5; color: #555;">Thank you for your order! Please complete your payment using the details below.</p>
              
              <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin: 24px 0;">
                <h3 style="margin: 0 0 12px; color: #333;">Order Summary</h3>
                ${orderItemsHtml}
                <div style="display: flex; justify-content: space-between; padding: 12px 0; font-weight: bold; font-size: 18px; color: #F97316;">
                  <span>Total</span>
                  <span>MWK ${safeTotal.toLocaleString()}</span>
                </div>
              </div>

              <div style="background: #fef3c7; padding: 20px; border-radius: 12px; margin: 24px 0;">
                <h3 style="margin: 0 0 12px; color: #92400E;">Payment Instructions</h3>
                <div style="font-size: 14px; color: #333;">${paymentInstructions}</div>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="${paymentUrl}" style="background: #F97316; color: white; padding: 12px 28px; text-decoration: none; border-radius: 40px; font-weight: bold; display: inline-block;">Confirm Payment</a>
              </div>

              ${discountBannerHtml}

              <hr style="margin: 30px 0 20px; border: none; border-top: 1px solid #eee;" />
              <p style="font-size: 12px; color: #999;">Questions? Just reply to this email – we're here to help.<br/>SpectrumCosmo Team – Wear your excitement with pride.</p>
            </div>
          </div>
        `;

        await sendMail({
          to: customer_email,
          subject: `Complete Your Payment for Order #${orderNumber} – SpectrumCosmo`,
          text: `Hello ${customer_name},\n\nPlease complete your payment here: ${paymentUrl}`,
          html,
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
