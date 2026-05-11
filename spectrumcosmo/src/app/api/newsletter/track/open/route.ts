import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const campaign = req.nextUrl.searchParams.get('campaign');
  const subscriber = req.nextUrl.searchParams.get('subscriber');
  if (!campaign || !subscriber) return new NextResponse(null, { status: 204 });

  const sql = getDb();
  // Avoid duplicate opens in a short time (optional)
  await sql`
    INSERT INTO newsletter_opens (campaign_id, subscriber_id, opened_at, user_agent, ip_address)
    VALUES (${parseInt(campaign)}, ${parseInt(subscriber)}, NOW(), ${req.headers.get('user-agent')}, ${req.ip || null})
    ON CONFLICT DO NOTHING
  `;
  // Update campaign open_count
  await sql`
    UPDATE newsletter_campaigns
    SET open_count = open_count + 1
    WHERE id = ${parseInt(campaign)}
  `;
  // Return a transparent 1x1 pixel
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  return new NextResponse(pixel, { headers: { 'Content-Type': 'image/gif' } });
}
