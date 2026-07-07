// lib/email/send.ts
import nodemailer from 'nodemailer';
import { renderEmailTemplate } from './templates';

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  trackId?: {
    campaignId: number;
    subscriberId: number;
  };
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const from = options.from || process.env.SMTP_FROM || 'SpectrumCosmo <noreply@spectrumcosmo.com>';
  
  // Add tracking pixel if provided
  let html = options.html;
  if (options.trackId) {
    const { campaignId, subscriberId } = options.trackId;
    const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/track-open?campaign=${campaignId}&subscriber=${subscriberId}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;" />`;
    html = html.replace('</body>', `${trackingPixel}</body>`);
  }

  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html,
    text: options.text || options.html.replace(/<[^>]*>/g, ''),
    replyTo: options.replyTo,
  });
}

export async function sendBulkEmails(
  recipients: Array<{ email: string; name?: string; id: number }>,
  subject: string,
  htmlTemplate: (recipient: { email: string; name?: string; id: number }) => string,
  trackId?: { campaignId: number }
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const recipient of recipients) {
    try {
      await sendEmail({
        to: recipient.email,
        subject,
        html: htmlTemplate(recipient),
        trackId: trackId ? { campaignId: trackId.campaignId, subscriberId: recipient.id } : undefined,
      });
      success++;
    } catch (error) {
      console.error(`Failed to send to ${recipient.email}:`, error);
      failed++;
    }
  }

  return { success, failed };
}
