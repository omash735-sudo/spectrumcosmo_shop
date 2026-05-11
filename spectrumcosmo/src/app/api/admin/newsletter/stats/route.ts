import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const sql = getDb();

  // Subscriber growth (last 12 months)
  const growth = await sql`
    SELECT DATE_TRUNC('month', confirmed_at) as month, COUNT(*) as new
    FROM subscribers
    WHERE confirmed_at IS NOT NULL
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `;

  // Campaign performance
  const campaigns = await sql`
    SELECT id, title, sent_at, open_count, click_count,
           (SELECT COUNT(*) FROM subscribers WHERE status='confirmed') as total_subscribers
    FROM newsletter_campaigns
    WHERE status = 'sent'
    ORDER BY sent_at DESC
  `;
  const performance = campaigns.map((c: any) => ({
    ...c,
    open_rate: ((c.open_count / c.total_subscribers) * 100).toFixed(1),
    click_rate: ((c.click_count / c.total_subscribers) * 100).toFixed(1),
  }));

  // Recent unsubscribes
  const unsubscribes = await sql`
    SELECT email, reason, details, created_at
    FROM unsubscribe_feedback
    ORDER BY created_at DESC
    LIMIT 20
  `;

  return NextResponse.json({ growth, performance, unsubscribes });
}
