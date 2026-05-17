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
    const { orderId, reason } = await req.json();

    const sql = getDb();

    const [order] = await sql`
      SELECT customer_email, customer_name, total_amount, id 
      FROM orders 
      WHERE id = ${orderId}::uuid
    `;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    await sql`
      UPDATE payment_confirmations
      SET status = 'rejected', reviewed_by = 1, reviewed_at = NOW(), rejection_reason = ${reason}
      WHERE order_id = ${orderId}::uuid
    `;

    await sql`
      UPDATE orders
      SET payment_status = 'pending', proof_of_payment_url = NULL, payment_note = NULL, status = 'pending'
      WHERE id = ${orderId}::uuid
    `;

    const orderNumber = order.id.slice(-8);
    const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}/payment`;

    const placeholders = {
      customer_name: order.customer_name,
      order_number: orderNumber,
      rejection_reason: reason,
      payment_url: paymentUrl,
    };

    const emailTemplate = await getEmailTemplate(sql, 'payment_rejected');
    
    if (emailTemplate && order.customer_email) {
      const emailHtml = replacePlaceholders(emailTemplate.html_template, placeholders);
      const emailSubject = replacePlaceholders(emailTemplate.subject, placeholders);
      
      await sendMail({
        to: order.customer_email,
        subject: emailSubject,
        text: `Your payment proof was rejected. Reason: ${reason}. Please upload a valid proof.`,
        html: emailHtml,
      }).catch(err => console.error('Email failed:', err));
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Reject error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
