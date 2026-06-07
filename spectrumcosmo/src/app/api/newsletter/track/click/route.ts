// app/api/newsletter/track-click/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const campaign = req.nextUrl.searchParams.get('campaign');
  const subscriber = req.nextUrl.searchParams.get('subscriber');
  const rawUrl = req.nextUrl.searchParams.get('url');

  if (!campaign || !subscriber || !rawUrl) {
    return new NextResponse('Invalid', { status: 400 });
  }

  const campaignId = parseInt(campaign, 10);
  const subscriberId = parseInt(subscriber, 10);
  const decodedUrl = decodeURIComponent(rawUrl);
  const ip = req.headers.get('x-forwarded-for') || null;
  const userAgent = req.headers.get('user-agent') || null;

  try {
    const sql = getDb();
    await sql`
      INSERT INTO newsletter_clicks (campaign_id, subscriber_id, clicked_at, url, user_agent, ip_address)
      VALUES (${campaignId}, ${subscriberId}, NOW(), ${decodedUrl}, ${userAgent}, ${ip})
    `;
    await sql`
      UPDATE newsletter_campaigns
      SET click_count = click_count + 1
      WHERE id = ${campaignId}
    `;
  } catch (err) {
    console.error('Click tracking error:', err);
    // Still redirect even if logging fails
  }

  return NextResponse.redirect(decodedUrl);
}
