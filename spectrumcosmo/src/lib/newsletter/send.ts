// /lib/newsletter/send.ts
import { getDb } from '@/lib/db';
import { sendMail } from '@/lib/mailer';

async function generateTrackingPixel(campaignId: number, subscriberId: number) {
  return `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter/track/open?campaign=${campaignId}&subscriber=${subscriberId}" width="1" height="1" />`;
}

async function wrapLinks(html: string, campaignId: number, subscriberId: number, baseUrl: string) {
  return html.replace(/href="(https?:\/\/[^"]+)"/g, (_, url) => {
    const redirectUrl = `${baseUrl}/api/newsletter/track/click?campaign=${campaignId}&subscriber=${subscriberId}&url=${encodeURIComponent(url)}`;
    return `href="${redirectUrl}"`;
  });
}

export async function sendNewsletter(campaignId: number) {
  const sql = getDb();

  // 1. Get campaign details
  const [campaign] = await sql`SELECT * FROM newsletter_campaigns WHERE id = ${campaignId}`;
  if (!campaign) throw new Error('Campaign not found');

  // 2. Get confirmed subscribers
  let subscribers;
  if (campaign.audience === 'customers') {
    subscribers = await sql`
      SELECT s.* FROM subscribers s
      JOIN users u ON s.email = u.email
      WHERE s.status = 'confirmed' AND u.role = 'customer'
    `;
  } else {
    subscribers = await sql`SELECT * FROM subscribers WHERE status = 'confirmed'`;
  }

  if (subscribers.length === 0) return;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
  for (const sub of subscribers) {
    const pixel = await generateTrackingPixel(campaignId, sub.id);
    let html = campaign.content;
    html = await wrapLinks(html, campaignId, sub.id, baseUrl);

    // Add unsubscribe link to footer
    const unsubscribeUrl = `${baseUrl}/api/subscribe/unsubscribe?email=${sub.email}`;
    const preferencesUrl = `${baseUrl}/newsletter/preferences?email=${sub.email}`;
    const footer = `<div style="margin-top:30px; padding-top:10px; border-top:1px solid #ddd; font-size:12px; color:#888;">
                      <a href="${unsubscribeUrl}">Unsubscribe</a> &nbsp;|&nbsp;
                      <a href="${preferencesUrl}">Manage preferences</a>
                    </div>`;
    html += footer + pixel;

    // Send using your mailer
    const result = await sendMail({
      to: sub.email,
      subject: campaign.title,
      text: campaign.content.replace(/<[^>]*>/g, ''), // plain text fallback
      html,
    });

    if (!result.sent) {
      console.error(`Failed to send to ${sub.email}: ${result.reason}`);
    }
  }

  // 4. Update campaign status
  await sql`
    UPDATE newsletter_campaigns
    SET status = 'sent', sent_at = NOW()
    WHERE id = ${campaignId}
  `;
}
