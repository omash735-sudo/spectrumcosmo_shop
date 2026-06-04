import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';
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
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const { proofImageUrl, transactionReference, notes } = await req.json();

    if (!proofImageUrl) {
      return NextResponse.json({ error: 'Proof image is required' }, { status: 400 });
    }

    const sql = getDb();

    const [order] = await sql`
      SELECT id, customer_name, customer_email, total_amount, payment_status, proof_of_payment_url
      FROM orders 
      WHERE id::text = ${orderId}
    `;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Order already paid' }, { status: 400 });
    }

    if (order.proof_of_payment_url) {
      return NextResponse.json({ error: 'Proof already submitted' }, { status: 400 });
    }

    const fullNote = transactionReference 
      ? `Transaction Ref: ${transactionReference}\n${notes || ''}`.trim()
      : notes || '';

    await sql`
      UPDATE orders 
      SET 
        proof_of_payment_url = ${proofImageUrl},
        payment_note = ${fullNote},
        payment_status = 'awaiting_verification',
        status = 'awaiting_verification',
        updated_at = NOW()
      WHERE id::text = ${orderId}
    `;

    try {
      await sql`
        INSERT INTO payment_confirmations (
          order_id, proof_image_url, transaction_reference, notes, status, submitted_at
        ) VALUES (
          ${orderId}::uuid, ${proofImageUrl}, ${transactionReference || null}, ${notes || null}, 'pending', NOW()
        )
      `;
    } catch (err) {
      console.log('Payment confirmation insert skipped');
    }

    const settings = await sql`SELECT setting_key, setting_value FROM system_settings`;
    const settingsMap: Record<string, string> = {};
    settings.forEach((s: any) => { settingsMap[s.setting_key] = s.setting_value; });

    const placeholders = {
      customer_name: order.customer_name,
      order_number: orderId.slice(-8),
      total_amount: order.total_amount.toLocaleString(),
      transaction_reference: transactionReference || 'N/A',
      proof_image_url: proofImageUrl,
      app_url: process.env.NEXT_PUBLIC_APP_URL || '',
      company_name: settingsMap.company_name || 'SpectrumCosmo',
      company_logo: settingsMap.company_logo || '',
    };

    if (order.customer_email) {
      const emailTemplate = await getEmailTemplate(sql, 'payment_proof_received');
      
      if (emailTemplate) {
        const emailHtml = replacePlaceholders(emailTemplate.html_template, placeholders);
        const emailSubject = replacePlaceholders(emailTemplate.subject, placeholders);
        
        await sendMail({
          to: order.customer_email,
          subject: emailSubject,
          text: `We received your payment proof for order ${orderId.slice(-8)}. Admin will review it shortly.`,
          html: emailHtml,
        }).catch(err => console.error('Email failed:', err));
      }
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      const adminTemplate = await getEmailTemplate(sql, 'admin_payment_proof_notification');
      
      if (adminTemplate) {
        const adminHtml = replacePlaceholders(adminTemplate.html_template, placeholders);
        const adminSubject = replacePlaceholders(adminTemplate.subject, placeholders);
        
        await sendMail({
          to: adminEmail,
          subject: adminSubject,
          text: `Payment proof uploaded for order ${orderId.slice(-8)}`,
          html: adminHtml,
        }).catch(err => console.error('Admin email failed:', err));
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Payment proof submitted. Admin will verify shortly.' 
    });
  } catch (err: any) {
    console.error('Payment confirmation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
