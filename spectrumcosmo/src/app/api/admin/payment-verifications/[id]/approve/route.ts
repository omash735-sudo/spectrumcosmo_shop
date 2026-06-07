// app/api/admin/payment-verifications/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { sendMail } from '@/lib/mailer';
import { updateOrderStatus } from '@/lib/order-status';
import { deductStock } from '@/lib/stock-manager';

// Types
interface Verification {
  proof_image_url: string;
  transaction_reference: string | null;
  notes: string | null;
}

interface Order {
  customer_email: string;
  customer_name: string;
  total_amount: number;
  delivery_address: string;
  id: string;
  status: string;
}

interface SystemSetting {
  setting_key: string;
  setting_value: string;
}

interface EmailTemplate {
  html_template: string;
  subject: string;
  text_content: string | null;
}

function replacePlaceholders(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

async function getEmailTemplate(sql: any, templateName: string): Promise<EmailTemplate | null> {
  const templates = await queryAsArray<EmailTemplate>`
    SELECT html_template, subject, text_content 
    FROM email_templates 
    WHERE name = ${templateName} AND is_active = true 
    LIMIT 1
  `;
  return templates[0] || null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id: verificationId } = await params;
    const { orderId } = await req.json();
    const adminId = (authError as any)?.id || null;
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';

    const sql = getDb();

    // Get payment verification details
    const verificationArray = await queryAsArray<Verification>`
      SELECT proof_image_url, transaction_reference, notes
      FROM payment_confirmations 
      WHERE id = ${verificationId}
    `;
    const verification = verificationArray[0];
    if (!verification) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
    }

    // Get order details
    const orderArray = await queryAsArray<Order>`
      SELECT customer_email, customer_name, total_amount, delivery_address, id, status
      FROM orders 
      WHERE id = ${orderId}::uuid
    `;
    const order = orderArray[0];
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Deduct stock
    const stockDeducted = await deductStock(orderId);
    if (!stockDeducted) {
      return NextResponse.json({ 
        error: 'Failed to deduct stock. Items may be out of stock.' 
      }, { status: 409 });
    }

    // Create receipt
    const receiptData = {
      receiptType: 'payment_proof',
      paymentStatus: 'paid',
      transactionReference: verification.transaction_reference,
      notes: verification.notes,
      verifiedAt: new Date().toISOString(),
      verifiedBy: adminId,
    };

    const receiptArray = await queryAsArray<{ id: string }>`
      INSERT INTO order_receipts (order_id, image_url, extracted_data, receipt_type, uploaded_by, created_at)
      VALUES (${orderId}, ${verification.proof_image_url}, ${JSON.stringify(receiptData)}, 'payment_proof', ${adminId}, NOW())
      RETURNING id
    `;
    const receipt = receiptArray[0];
    if (!receipt) {
      return NextResponse.json({ error: 'Failed to create receipt' }, { status: 500 });
    }

    // Update order status
    await updateOrderStatus({
      orderId,
      newStatusSlug: 'approved',
      adminNotes: `Payment verified. Receipt ID: ${receipt.id}`,
      changedBy: 'admin',
      changedById: adminId,
      ipAddress,
    });

    // Update payment verification status
    await sql`
      UPDATE payment_confirmations
      SET status = 'approved', reviewed_by = ${adminId}, reviewed_at = NOW()
      WHERE id = ${verificationId}
    `;

    // Send confirmation email
    const orderNumber = order.id.slice(-8);
    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/account/orders`;

    const settingsArray = await queryAsArray<SystemSetting>`
      SELECT setting_key, setting_value FROM system_settings
    `;
    const settingsMap: Record<string, string> = {};
    settingsArray.forEach((s) => {
      settingsMap[s.setting_key] = s.setting_value;
    });

    const defaultDays = parseInt(settingsMap.default_delivery_days || '5');
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + defaultDays);
    const formattedDeliveryDate = estimatedDelivery.toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });

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

    return NextResponse.json({ 
      success: true,
      receiptId: receipt.id,
      message: 'Payment approved, stock deducted, and receipt created'
    });
  } catch (err) {
    console.error('Approve error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
