import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';

function replacePlaceholders(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

async function getEmailTemplate(sql: any, templateName: string) {
  const templates = await sql`
    SELECT html_template, subject, text_content 
    FROM email_templates 
    WHERE name = ${templateName} AND is_active = true 
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

    const settings = await sql`SELECT setting_key, setting_value FROM system_settings`;
    const settingsMap: Record<string, string> = {};
    settings.forEach((s: any) => { settingsMap[s.setting_key] = s.setting_value; });

    const defaultDays = parseInt(settingsMap.default_delivery_days || '5');
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + defaultDays);
    const formattedDeliveryDate = estimatedDelivery.toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });

    const [order] = await sql`
      SELECT customer_email, customer_name, total_amount, delivery_address, id 
      FROM orders 
      WHERE id = ${orderId}::uuid
    `;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    await sql`
      UPDATE payment_confirmations
      SET status = 'approved', reviewed_by = 1, reviewed_at = NOW()
      WHERE order_id = ${orderId}::uuid
    `;

    await sql`
      UPDATE orders
      SET status = 'approved', payment_status = 'paid', payment_verified_at = NOW()
      WHERE id = ${orderId}::uuid
    `;

    const orderNumber = order.id.slice(-8);
    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/account/orders`;

    const placeholders = {
      customer_name: order.customer_name,
      order_number: orderNumber,
      total_amount: order.total_amount.toLocaleString(),
      delivery_address: order.delivery_address,
      estimated_delivery: formattedDeliveryDate,
      tracking_url: trackingUrl,
      company_name: settingsMap.company_name || 'SpectrumCosmo',
      company_logo: settingsMap.company_logo || '',
    };

    const emailTemplate = await getEmailTemplate(sql, 'payment_approved');
    
    if (emailTemplate && order.customer_email) {
      const emailHtml = replacePlaceholders(emailTemplate.html_template, placeholders);
      const emailSubject = replacePlaceholders(emailTemplate.subject, placeholders);
      
      await sendMail({
        to: order.customer_email,
        subject: emailSubject,
        text: `Your payment has been approved. Order #${orderNumber} is confirmed.`,
        html: emailHtml,
      }).catch(err => console.error('Email failed:', err));
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Approve error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
