// app/api/admin/newsletter/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const sql = getDb();

    const [subscriberCount] = await sql`
      SELECT COUNT(*) as count FROM subscribers WHERE status = 'confirmed'
    `;

    const [activeCount] = await sql`
      SELECT COUNT(*) as count FROM subscribers 
      WHERE status = 'confirmed' AND confirmed_at > NOW() - INTERVAL '90 days'
    `;

    const [campaignCount] = await sql`
      SELECT COUNT(*) as count FROM newsletter_campaigns
    `;

    const [avgStats] = await sql`
      SELECT 
        AVG(open_count) as avg_open_count,
        AVG(total_subscribers) as avg_total_subscribers
      FROM newsletter_campaigns
      WHERE status = 'sent' AND total_subscribers > 0
    `;

    let averageOpenRate = 0;
    if (avgStats?.avg_open_count && avgStats?.avg_total_subscribers) {
      averageOpenRate = Math.round((Number(avgStats.avg_open_count) / Number(avgStats.avg_total_subscribers)) * 100);
    }

    const campaignPerformance = await sql`
      SELECT 
        id,
        title,
        sent_at,
        open_count,
        click_count,
        total_subscribers,
        CASE WHEN total_subscribers > 0 THEN (open_count::float / total_subscribers * 100) ELSE 0 END as open_rate,
        CASE WHEN open_count > 0 THEN (click_count::float / open_count * 100) ELSE 0 END as click_rate
      FROM newsletter_campaigns
      WHERE status = 'sent' AND total_subscribers > 0
      ORDER BY sent_at DESC
      LIMIT 5
    `;

    const growthData = await sql`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        COUNT(*) as new_count
      FROM subscribers 
      WHERE status = 'confirmed' AND created_at > NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) ASC
    `;

    const unsubscribeLogs = await sql`
      SELECT 
        id,
        email,
        reason,
        COALESCE(details, '') as details,
        TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
      FROM unsubscribe_feedback
      ORDER BY created_at DESC
      LIMIT 10
    `;

    const totalSubscribers = Number(subscriberCount?.count) || 0;
    const totalActive = Number(activeCount?.count) || 0;
    const totalCampaigns = Number(campaignCount?.count) || 0;

    const growth = (growthData || []).map((row: any) => ({
      month: row.month || 'No Data',
      new: Number(row.new_count) || 0,
    }));

    if (growth.length === 0) {
      growth.push({ month: 'No Data', new: 0 });
    }

    const performance = (campaignPerformance || []).map((row: any) => ({
      id: row.id || '',
      title: row.title || 'Untitled',
      sent_at: row.sent_at || '',
      open_count: Number(row.open_count) || 0,
      click_count: Number(row.click_count) || 0,
      open_rate: Math.round(Number(row.open_rate) || 0),
      click_rate: Math.round(Number(row.click_rate) || 0),
      total_subscribers: Number(row.total_subscribers) || 0,
    }));

    const unsubscribes = (unsubscribeLogs || []).map((row: any) => ({
      id: row.id || '',
      email: row.email || '',
      reason: row.reason || 'No reason provided',
      details: row.details || '',
      created_at: row.created_at || '',
    }));

    return NextResponse.json({
      totalSubscribers,
      totalCampaigns,
      averageOpenRate,
      totalActive,
      growth,
      performance,
      unsubscribes,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
