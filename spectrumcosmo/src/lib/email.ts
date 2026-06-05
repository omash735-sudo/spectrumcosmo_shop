// lib/email.ts
import nodemailer from 'nodemailer';
import { getDb } from './db';
import { getStatusDisplayInfo } from './order-status';

// Types
interface EmailTemplate {
  subject: string;
  html: string;
}

interface DynamicStatusEmailData {
  customerEmail: string;
  customerName: string;
  orderId: string;
  orderNumber: string;
  oldStatus: string;
  newStatus: string;
  totalAmount: number;
  trackingNumber?: string;
  adminNotes?: string;
}

interface OrderConfirmationData {
  email: string;
  name: string;
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  deliveryAddress: string;
  estimatedDays: number;
}

interface VerificationEmailData {
  email: string;
  name: string;
  token: string;
}

// Constants
const TEMPLATE_CACHE_TTL = 3600000; // 1 hour
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Template cache with expiration
interface CachedTemplate {
  template: EmailTemplate;
  expiresAt: number;
}

let templateCache: Map<string, CachedTemplate> = new Map();

// Email transporter with connection pooling
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;
  
  const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';
  
  if (emailProvider === 'gmail') {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      pool: true,
      maxConnections: 5,
      rateLimit: 10,
    });
  } else if (emailProvider === 'smtp') {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      pool: true,
      maxConnections: 5,
      rateLimit: 10,
    });
  } else {
    throw new Error(`Unknown email provider: ${emailProvider}`);
  }
  
  return transporter;
}

// Clean expired cache entries
function cleanTemplateCache(): void {
  const now = Date.now();
  for (const [key, value] of templateCache) {
    if (now > value.expiresAt) {
      templateCache.delete(key);
    }
  }
}

setInterval(cleanTemplateCache, 60000);

async function getEmailTemplate(name: string): Promise<EmailTemplate | null> {
  // Check cache
  const cached = templateCache.get(name);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.template;
  }
  
  const sql = getDb();
  const [template] = await sql`
    SELECT subject, html_template FROM email_templates 
    WHERE name = ${name} AND is_active = true
  `;
  
  if (template) {
    const emailTemplate: EmailTemplate = {
      subject: template.subject,
      html: template.html_template,
    };
    templateCache.set(name, {
      template: emailTemplate,
      expiresAt: Date.now() + TEMPLATE_CACHE_TTL,
    });
    return emailTemplate;
  }
  
  return null;
}

function replacePlaceholders(text: string, placeholders: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(placeholders)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  
  // Handle conditional blocks {{#key}}content{{/key}}
  const conditionalRegex = /{{#(\w+)}}([\s\S]*?){{\/\1}}/g;
  result = result.replace(conditionalRegex, (match, key, content) => {
    const value = placeholders[key];
    if (value && value !== '' && value !== '0' && value !== 'false') {
      return content;
    }
    return '';
  });
  
  return result;
}

function getStatusColorHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    yellow: '#EAB308',
    blue: '#3B82F6',
    purple: '#8B5CF6',
    orange: '#F97316',
    green: '#22C55E',
    red: '#EF4444',
    gray: '#6B7280',
  };
  return colorMap[colorName] || '#F97316';
}

// Retry wrapper for email sending
async function sendEmailWithRetry(
  mailOptions: nodemailer.SendMailOptions,
  retries: number = MAX_RETRIES
): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const transporter = getTransporter();
      await transporter.sendMail(mailOptions);
      return true;
    } catch (err) {
      console.error(`Email send attempt ${i + 1} failed:`, err);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, i)));
      }
    }
  }
  return false;
}

// =============================================
// EXPORTED PUBLIC FUNCTIONS
// =============================================

export async function sendDynamicStatusEmail(data: DynamicStatusEmailData): Promise<void> {
  const statusInfo = await getStatusDisplayInfo(data.newStatus);
  if (!statusInfo) {
    console.error(`Unknown status: ${data.newStatus}`);
    return;
  }

  const template = await getEmailTemplate('order_status_update');
  if (!template) {
    console.error('Email template not found for order_status_update');
    return;
  }

  const statusMessage = statusInfo.description || `Your order has been ${statusInfo.name.toLowerCase()}.`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spectrumcosmo.com';

  const placeholders: Record<string, string> = {
    customer_name: data.customerName,
    order_number: data.orderNumber,
    total_amount: `MWK ${data.totalAmount.toLocaleString()}`,
    status_name: statusInfo.name,
    status_color: getStatusColorHex(statusInfo.color),
    status_message: statusMessage,
    tracking_url: `${appUrl}/account/orders/${data.orderId}`,
    tracking_number: data.trackingNumber || '',
    admin_notes: data.adminNotes || '',
  };

  const subject = replacePlaceholders(template.subject, placeholders);
  const html = replacePlaceholders(template.html, placeholders);
  const fromEmail = process.env.GMAIL_USER || process.env.SMTP_USER || 'noreply@spectrumcosmo.com';

  await sendEmailWithRetry({
    from: `"SpectrumCosmo" <${fromEmail}>`,
    to: data.customerEmail,
    subject,
    html,
  });
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationData): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spectrumcosmo.com';
  const fromEmail = process.env.GMAIL_USER || process.env.SMTP_USER || 'noreply@spectrumcosmo.com';
  
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">MWK ${item.price.toLocaleString()}</td>
    </tr>
  `).join('');
  
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 20px; overflow: hidden;">
      <div style="background: #F97316; padding: 24px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed!</h1>
      </div>
      <div style="padding: 24px; background: white;">
        <p style="font-size: 16px;">Hi <strong>${data.name}</strong>,</p>
        <p>Thank you for your order! We've received your order and will process it shortly.</p>
        
        <div style="background: #f9f9f9; padding: 16px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 0 0 8px;"><strong>Order Number:</strong> ${data.orderNumber}</p>
          <p style="margin: 0;"><strong>Estimated Delivery:</strong> ${data.estimatedDays} business days</p>
        </div>
        
        <h3 style="margin: 20px 0 12px;">Order Items</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="padding: 8px; text-align: left;">Product</th>
              <th style="padding: 8px; text-align: center;">Qty</th>
              <th style="padding: 8px; text-align: right;">Price</th>
             </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 12px 8px; text-align: right; font-weight: bold;">Total:</td>
              <td style="padding: 12px 8px; text-align: right; font-weight: bold; color: #F97316;">
                MWK ${data.totalAmount.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
        
        <div style="text-align: center; margin: 30px 0 20px;">
          <a href="${appUrl}/account/orders/${data.orderId}" 
             style="background: #F97316; color: white; padding: 10px 24px; border-radius: 40px; text-decoration: none; font-weight: bold;">
            Track Your Order
          </a>
        </div>
        
        <hr style="margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">SpectrumCosmo – Wear your excitement with pride.</p>
      </div>
    </div>
  `;
  
  await sendEmailWithRetry({
    from: `"SpectrumCosmo" <${fromEmail}>`,
    to: data.email,
    subject: `Order Confirmed #${data.orderNumber}`,
    text: `Thank you for your order! Your order #${data.orderNumber} has been confirmed. Total: MWK ${data.totalAmount.toLocaleString()}`,
    html,
  });
}

export async function sendVerificationEmail(email: string, name: string, token: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spectrumcosmo.com';
  const verificationUrl = `${appUrl}/api/auth/verify-email?token=${token}`;
  const fromEmail = process.env.GMAIL_USER || process.env.SMTP_USER || 'noreply@spectrumcosmo.com';
  
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 20px; overflow: hidden;">
      <div style="background: #F97316; padding: 24px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
      </div>
      <div style="padding: 24px; background: white;">
        <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
        <p>Thanks for joining SpectrumCosmo! Please confirm your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${verificationUrl}" style="background: #F97316; color: white; padding: 12px 28px; text-decoration: none; border-radius: 40px; font-weight: bold; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="font-size: 13px; color: #777;">This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.</p>
        <hr style="margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">SpectrumCosmo – Wear your excitement with pride.</p>
      </div>
    </div>
  `;
  
  await sendEmailWithRetry({
    from: `"SpectrumCosmo" <${fromEmail}>`,
    to: email,
    subject: 'Please verify your email – SpectrumCosmo',
    text: `Hi ${name}, please verify your email by clicking this link: ${verificationUrl}`,
    html,
  });
}

export async function renderOrderTimeline(orderId: string, currentStatus: string) {
  const sql = getDb();
  
  const allStatuses = await sql`
    SELECT * FROM order_statuses 
    WHERE is_active = true AND step_index >= 0
    ORDER BY step_index ASC
  `;
  
  const history = await sql`
    SELECT new_status, changed_at FROM order_status_history 
    WHERE order_id = ${orderId}
    ORDER BY changed_at ASC
  `;
  
  const completedSteps = new Set(history.map(h => h.new_status));
  
  return allStatuses.map(status => ({
    name: status.name,
    slug: status.slug,
    description: status.description,
    color: status.color,
    icon: status.icon,
    stepIndex: status.step_index,
    isCompleted: completedSteps.has(status.slug) || currentStatus === status.slug,
    isCurrent: currentStatus === status.slug,
    completedAt: history.find(h => h.new_status === status.slug)?.changed_at,
  }));
}
