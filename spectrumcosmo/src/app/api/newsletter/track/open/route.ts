// app/api/newsletter/track-open/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const campaign = req.nextUrl.searchParams.get('campaign');
  const subscriber = req.nextUrl.searchParams.get('subscriber');

  if (!campaign || !subscriber) {
    return new NextResponse(null, { status: 204 });
  }

  const campaignId = parseInt(campaign, 10);
  const subscriberId = parseInt(subscriber, 10);
  const ip = req.headers.get('x-forwarded-for') || req.ip || null;
  const userAgent = req.headers.get('user-agent') || null;

  try {
    const sql = getDb();
    await sql`
      INSERT INTO newsletter_opens (campaign_id, subscriber_id, opened_at, user_agent, ip_address)
      VALUES (${campaignId}, ${subscriberId}, NOW(), ${userAgent}, ${ip})
      ON CONFLICT (campaign_id, subscriber_id) DO NOTHING
    `;
    await sql`
      UPDATE newsletter_campaigns
      SET open_count = open_count + 1
      WHERE id = ${campaignId}
    `;
  } catch (err) {
    console.error('Open tracking error:', err);
    // Still return pixel even if logging fails
  }

  // 1x1 transparent GIF pixel
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  return new NextResponse(pixel, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
