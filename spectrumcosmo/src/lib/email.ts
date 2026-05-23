import nodemailer from 'nodemailer';
import { getDb } from './db';
import { getStatusDisplayInfo } from './order-status';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Template cache
let templateCache: Map<string, { subject: string; html: string }> = new Map();

async function getEmailTemplate(name: string): Promise<{ subject: string; html: string } | null> {
  if (templateCache.has(name)) {
    return templateCache.get(name)!;
  }
  
  const sql = getDb();
  const [template] = await sql`
    SELECT subject, html_template FROM email_templates 
    WHERE name = ${name} AND is_active = true
  `;
  
  if (template) {
    templateCache.set(name, {
      subject: template.subject,
      html: template.html_template,
    });
  }
  
  return template || null;
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
    if (placeholders[key] && placeholders[key] !== '') {
      return content;
    }
    return '';
  });
  return result;
}

export interface DynamicStatusEmailData {
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

export async function sendDynamicStatusEmail(data: DynamicStatusEmailData) {
  const statusInfo = await getStatusDisplayInfo(data.newStatus);
  if (!statusInfo) {
    console.error(`Unknown status: ${data.newStatus}`);
    return;
  }

  const template = await getEmailTemplate('order_status_update');
  if (!template) {
    console.error('Email template not found');
    return;
  }

  // Build status message dynamically from database description
  const statusMessage = statusInfo.description || `Your order has been ${statusInfo.name.toLowerCase()}.`;

  const placeholders: Record<string, string> = {
    customer_name: data.customerName,
    order_number: data.orderNumber,
    total_amount: `MWK ${data.totalAmount.toLocaleString()}`,
    status_name: statusInfo.name,
    status_color: this.getStatusColorHex(statusInfo.color),
    status_message: statusMessage,
    tracking_url: `${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${data.orderId}`,
    tracking_number: data.trackingNumber || '',
    admin_notes: data.adminNotes || '',
  };

  const subject = replacePlaceholders(template.subject, placeholders);
  const html = replacePlaceholders(template.html, placeholders);

  await transporter.sendMail({
    from: `"SpectrumCosmo" <${process.env.GMAIL_USER}>`,
    to: data.customerEmail,
    subject,
    html,
  });
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

export async function renderOrderTimeline(orderId: string, currentStatus: string) {
  const sql = getDb();
  
  // Get all statuses for timeline
  const allStatuses = await sql`
    SELECT * FROM order_statuses 
    WHERE is_active = true AND step_index >= 0
    ORDER BY step_index ASC
  `;
  
  // Get history for this order
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
