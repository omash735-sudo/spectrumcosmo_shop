// app/api/admin/newsletter/campaigns/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const sql = getDb();

    const campaigns = await sql`
      SELECT 
        id,
        title,
        status,
        audience,
        open_count,
        click_count,
        unsubscribe_count,
        created_at,
        sent_at,
        scheduled_for,
        segment_name,
        total_subscribers
      FROM newsletter_campaigns
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Campaigns error:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}
