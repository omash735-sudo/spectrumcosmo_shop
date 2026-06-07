// app/api/admin/newsletter/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// Types
interface CountResult {
  count: string | number;
}

interface GrowthRow {
  month: Date;
  new: string | number;
}

interface CampaignRow {
  id: string;
  title: string;
  sent_at: Date;
  open_count: number;
  click_count: number;
  total_subscribers: number;
}

interface CampaignPerformance extends CampaignRow {
  open_rate: string;
  click_rate: string;
}

interface UnsubscribeRow {
  email: string;
  reason: string | null;
  details: string | null;
  created_at: Date;
}

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const sql = getDb();

    // Total active subscribers
    const totalActiveResult = await queryAsArray<CountResult>`
      SELECT COUNT(*) as count FROM subscribers WHERE status = 'confirmed'
    `;
    const totalActive = Number(totalActiveResult[0]?.count ?? 0);

    // Subscriber growth (last 12 months)
    const growthRows = await queryAsArray<GrowthRow>`
      SELECT DATE_TRUNC('month', confirmed_at) as month, COUNT(*) as new
      FROM subscribers
      WHERE confirmed_at IS NOT NULL
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `;
    const growth = growthRows.map((row) => ({
      month: new Date(row.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      new: Number(row.new),
    }));

    // Campaign performance
    const campaignRows = await queryAsArray<CampaignRow>`
      SELECT 
        c.id,
        c.title,
        c.sent_at,
        c.open_count,
        c.click_count,
        (SELECT COUNT(*) FROM subscribers WHERE status = 'confirmed') as total_subscribers
      FROM newsletter_campaigns c
      WHERE c.status = 'sent'
      ORDER BY c.sent_at DESC
    `;

    const performance: CampaignPerformance[] = campaignRows.map((c) => ({
      ...c,
      open_rate: ((c.open_count / c.total_subscribers) * 100).toFixed(1),
      click_rate: ((c.click_count / c.total_subscribers) * 100).toFixed(1),
    }));

    // Recent unsubscribes
    const unsubscribes = await queryAsArray<UnsubscribeRow>`
      SELECT email, reason, details, created_at
      FROM unsubscribe_feedback
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return NextResponse.json({
      totalActive,
      growth,
      performance,
      unsubscribes,
    });
  } catch (err) {
    console.error('Newsletter stats error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
