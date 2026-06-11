// lib/notification-email.ts
import { sendDynamicStatusEmail, sendOrderConfirmationEmail, sendVerificationEmail } from '@/lib/email';
import nodemailer from 'nodemailer';

// Create a transporter for admin notifications (using same config as your email.ts)
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

export async function sendAdminNotificationEmail({
  to,
  name,
  title,
  message,
}: {
  to: string;
  name: string;
  title: string;
  message: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://spectrumcosmo.com';
  const fromEmail = process.env.GMAIL_USER || process.env.SMTP_USER || 'noreply@spectrumcosmo.com';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #F97316, #EA580C); padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; }
        .greeting { font-size: 18px; color: #1f2937; margin-bottom: 20px; }
        .message { font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 30px; background: #f9f9f9; padding: 16px; border-radius: 12px; }
        .button { display: inline-block; background: #F97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 40px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; margin-top: 20px; }
        .footer a { color: #F97316; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Spectrum Cosmo</h1>
        </div>
        <div class="content">
          <div class="greeting">Hello ${name || 'Customer'},</div>
          <div class="message">
            <strong>${title}</strong><br><br>
            ${message.replace(/\n/g, '<br>')}
          </div>
          <div style="text-align: center;">
            <a href="${appUrl}/account/notifications" class="button">View All Notifications</a>
          </div>
          <div class="footer">
            <a href="${appUrl}/account/notifications/settings">Manage preferences</a> | 
            <a href="${appUrl}/unsubscribe">Unsubscribe</a><br>
            &copy; ${new Date().getFullYear()} Spectrum Cosmo. All rights reserved.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const transporter = getTransporter();
  
  try {
    await transporter.sendMail({
      from: `"SpectrumCosmo" <${fromEmail}>`,
      to,
      subject: title,
      text: `${title}\n\n${message}\n\nView all notifications: ${appUrl}/account/notifications`,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send admin notification email:', error);
    return { success: false, error };
  }
}
