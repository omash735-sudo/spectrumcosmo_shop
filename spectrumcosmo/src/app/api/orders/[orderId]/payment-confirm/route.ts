import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';

// Helper to replace placeholders in templates
function replacePlaceholders(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

// Helper to get email template from database
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
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;
    const { user } = await getVerifiedUser(req);
    const { proofImageUrl, transactionReference, notes } = await req.json();

    if (!proofImageUrl) {
      return NextResponse.json({ error: 'Proof image is required' }, { status: 400 });
    }

    const sql = getDb();

    // Get order details
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

    // Update order with proof
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

    // Insert into payment_confirmations
    try {
      await sql`
        INSERT INTO payment_confirmations (order_id, proof_image_url, transaction_reference, notes, status)
        VALUES (${orderId}, ${proofImageUrl}, ${transactionReference || null}, ${notes || null}, 'pending')
      `;
    } catch (err) {
      console.log('payment_confirmations table not yet created');
    }

    // Get company settings for branding
    const settings = await sql`SELECT setting_key, setting_value FROM system_settings`;
    const settingsMap: Record<string, string> = {};
    settings.forEach((s: any) => { settingsMap[s.setting_key] = s.setting_value; });

    // Prepare placeholder data
    const placeholders = {
      customer_name: order.customer_name,
      order_number: orderId.slice(-8),
      total_amount: order.total_amount.toLocaleString(),
      transaction_reference: transactionReference || 'N/A',
      proof_image_url: proofImageUrl,
      app_url: process.env.NEXT_PUBLIC_APP_URL || '',
      company_name: settingsMap.company_name || 'SpectrumCosmo',
      company_logo: settingsMap.company_logo || 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913280-removebg-preview_cwcz7u.png',
    };

    // Send confirmation email to customer using dynamic template
    if (order.customer_email) {
      const emailTemplate = await getEmailTemplate(sql, 'payment_proof_received');
      
      let emailHtml = '';
      let emailSubject = 'Payment Proof Received';
      
      if (emailTemplate) {
        emailHtml = replacePlaceholders(emailTemplate.html_template, placeholders);
        emailSubject = replacePlaceholders(emailTemplate.subject, placeholders);
      } else {
        // Fallback template (only used if no template exists in DB)
        emailHtml = `
          <div style="font-family: Arial; max-width:600px;">
            <h2>Payment Proof Received</h2>
            <p>Hello {{customer_name}},</p>
            <p>We have received your payment proof for order <strong>{{order_number}}</strong>.</p>
            <p>Our team will review it and update you within 24 hours.</p>
            <p>Thank you for shopping with {{company_name}}!</p>
          </div>
        `;
        emailHtml = replacePlaceholders(emailHtml, placeholders);
      }
      
      await sendMail({
        to: order.customer_email,
        subject: emailSubject,
        text: `We received your payment proof for order ${orderId.slice(-8)}. Admin will review it shortly.`,
        html: emailHtml,
      }).catch(err => console.error('Email failed:', err));
    }

    // Send admin notification using dynamic template
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      const adminTemplate = await getEmailTemplate(sql, 'admin_payment_proof_notification');
      
      let adminHtml = '';
      let adminSubject = 'Payment Proof Uploaded';
      
      if (adminTemplate) {
        adminHtml = replacePlaceholders(adminTemplate.html_template, placeholders);
        adminSubject = replacePlaceholders(adminTemplate.subject, placeholders);
      } else {
        adminHtml = `
          <div style="font-family: Arial; max-width:600px;">
            <h2>Payment Proof Uploaded</h2>
            <p><strong>Order:</strong> {{order_number}}</p>
            <p><strong>Customer:</strong> {{customer_name}}</p>
            <p><strong>Amount:</strong> MWK {{total_amount}}</p>
            <p><strong>Transaction Reference:</strong> {{transaction_reference}}</p>
            <p><a href="{{app_url}}/admin/payment-verifications">Review Payment</a></p>
          </div>
        `;
        adminHtml = replacePlaceholders(adminHtml, placeholders);
      }
      
      await sendMail({
        to: adminEmail,
        subject: adminSubject,
        text: `Payment proof uploaded for order ${orderId.slice(-8)}`,
        html: adminHtml,
      }).catch(err => console.error('Admin email failed:', err));
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
