import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';

// Helper to render email with placeholders
function renderEmailTemplate(template: string, placeholders: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(placeholders)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

// Helper to get email template from database
async function getEmailTemplate(sql: any, name: string) {
  const templates = await sql`
    SELECT html_template, subject FROM email_templates 
    WHERE name = ${name} AND is_active = true 
    LIMIT 1
  `;
  return templates[0] || null;
}

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

    // Get system settings for delivery estimate
    const settings = await sql`
      SELECT setting_key, setting_value FROM system_settings
    `;
    const settingsMap: Record<string, string> = {};
    settings.forEach((s: any) => { settingsMap[s.setting_key] = s.setting_value; });

    // Calculate estimated delivery
    const defaultDays = parseInt(settingsMap.default_delivery_days || '5');
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + defaultDays);
    const formattedDeliveryDate = estimatedDelivery.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Get customer details
    const [order] = await sql`
      SELECT customer_email, customer_name, total_amount, delivery_address, id 
      FROM orders 
      WHERE id = ${orderId}
    `;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

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

    const orderNumber = order.id.slice(-8);
    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/account/orders`;

    // Common placeholders
    const placeholders = {
      customer_name: order.customer_name,
      order_number: orderNumber,
      total_amount: order.total_amount.toLocaleString(),
      delivery_address: order.delivery_address,
      estimated_delivery: formattedDeliveryDate,
      tracking_url: trackingUrl,
    };

    // Try to get email template from database
    let emailTemplate = await getEmailTemplate(sql, 'payment_approved');
    
    let emailHtml: string;
    let emailSubject: string;

    if (emailTemplate) {
      emailHtml = renderEmailTemplate(emailTemplate.html_template, placeholders);
      emailSubject = renderEmailTemplate(emailTemplate.subject, placeholders);
    } else {
      // Fallback email template
      emailHtml = `
        <div style="font-family: Arial; max-width:600px; margin:auto; border:1px solid #ddd; border-radius:16px; overflow:hidden;">
          <div style="background:#F97316; padding:20px; text-align:center;">
            <img src="${settingsMap.invoice_logo_url || 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png'}" style="max-width:150px;" />
            <h1 style="color:white; margin:10px 0 0;">Payment Approved! 🎉</h1>
          </div>
          <div style="padding:24px;">
            <p>Hello <strong>${order.customer_name}</strong>,</p>
            <p>Great news! Your payment of <strong>MWK ${order.total_amount.toLocaleString()}</strong> has been <strong>approved and confirmed</strong>.</p>
            
            <div style="background:#f9fafb; padding:20px; border-radius:12px; margin:20px 0;">
              <h3 style="margin-top:0;">Order Confirmed</h3>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span>Order Number</span>
                <span><strong>#${orderNumber}</strong></span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span>Total Amount</span>
                <span><strong>MWK ${order.total_amount.toLocaleString()}</strong></span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                <span>Payment Method</span>
                <span>Manual Payment</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span>Estimated Delivery</span>
                <span><strong>${formattedDeliveryDate}</strong></span>
              </div>
            </div>

            <p><strong>Delivery Address:</strong><br/>${order.delivery_address}</p>
            <p>Your order is now being prepared for shipping. You'll receive another notification when it's on the way.</p>

            <div style="text-align:center; margin: 24px 0;">
              <a href="${trackingUrl}" style="display:inline-block; background:#F97316; color:white; padding:12px 28px; text-decoration:none; border-radius:30px; font-weight:bold;">Track Your Order →</a>
            </div>

            <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              <p style="margin:0; font-size:14px; color:#92400E;">🎉 Share your experience and get 15% off your next purchase! 🎉</p>
            </div>
          </div>
          <div style="background:#f9fafb; padding:20px; text-align:center; font-size:12px; color:#6b7280; border-top:1px solid #e5e7eb;">
            <p>${settingsMap.company_name || 'SpectrumCosmo'} – Wear your excitement with pride.</p>
            <p>${settingsMap.company_address || 'Lilongwe, Malawi'} | <a href="mailto:${settingsMap.company_email || 'hello@spectrumcosmo.shop'}" style="color:#F97316;">${settingsMap.company_email || 'hello@spectrumcosmo.shop'}</a></p>
            <p>© ${new Date().getFullYear()} ${settingsMap.company_name || 'SpectrumCosmo'}. ${settingsMap.footer_copyright || 'All rights reserved.'}</p>
          </div>
        </div>
      `;
      emailSubject = `✅ Payment Approved! Your Order #${orderNumber} is Confirmed`;
    }

    await sendMail({
      to: order.customer_email,
      subject: emailSubject,
      text: `Hello ${order.customer_name},\n\nYour payment has been approved. Your order is confirmed and will be shipped soon.\n\nEstimated delivery: ${formattedDeliveryDate}\n\nTrack your order: ${trackingUrl}`,
      html: emailHtml,
    }).catch(err => console.error('Approval email failed:', err));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Approve error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
