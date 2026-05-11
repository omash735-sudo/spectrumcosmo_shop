import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const campaign = req.nextUrl.searchParams.get('campaign');
  const subscriber = req.nextUrl.searchParams.get('subscriber');
  const rawUrl = req.nextUrl.searchParams.get('url');
  if (!campaign || !subscriber || !rawUrl) return new NextResponse('Invalid', { status: 400 });

  const sql = getDb();
  await sql`
    INSERT INTO newsletter_clicks (campaign_id, subscriber_id, clicked_at, url, user_agent, ip_address)
    VALUES (${parseInt(campaign)}, ${parseInt(subscriber)}, NOW(), ${rawUrl}, ${req.headers.get('user-agent')}, ${req.ip || null})
  `;
  await sql`
    UPDATE newsletter_campaigns
    SET click_count = click_count + 1
    WHERE id = ${parseInt(campaign)}
  `;
  return NextResponse.redirect(decodeURIComponent(rawUrl));
}
