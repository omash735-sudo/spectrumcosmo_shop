// lib/notification-email.ts
import { sendEmail } from '@/lib/email';

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
  
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 20px; overflow: hidden;">
      <div style="background: #F97316; padding: 24px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${title}</h1>
      </div>
      <div style="padding: 24px; background: white;">
        <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
        <div style="background: #f9f9f9; padding: 16px; border-radius: 12px; margin: 20px 0;">
          <p style="margin: 0; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
        </div>
        <div style="text-align: center; margin: 30px 0 20px;">
          <a href="${appUrl}/account/notifications" 
             style="background: #F97316; color: white; padding: 10px 24px; border-radius: 40px; text-decoration: none; font-weight: bold;">
            View All Notifications
          </a>
        </div>
        <hr style="margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">
          You're receiving this because you have email notifications enabled.<br>
          <a href="${appUrl}/account/notifications/settings" style="color: #F97316;">Manage preferences</a>
        </p>
      </div>
    </div>
  `;
  
  await sendEmail({
    to,
    subject: title,
    text: message,
    html,
  });
}
