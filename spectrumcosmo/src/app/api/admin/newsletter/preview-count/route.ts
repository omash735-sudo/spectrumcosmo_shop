// app/api/admin/newsletter/preview-count/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { audience, topicFilters, frequencyFilter, promotionsFilter } = body;

    const sql = getDb();

    // Get total confirmed subscribers
    const [totalResult] = await sql`
      SELECT COUNT(*) as total FROM subscribers WHERE status = 'confirmed'
    `;

    let countQuery = `SELECT COUNT(*) as count FROM subscribers WHERE status = 'confirmed'`;

    if (audience === 'active') {
      countQuery += ` AND confirmed_at > NOW() - INTERVAL '90 days'`;
    } else if (audience === 'segment') {
      if (topicFilters && topicFilters.length > 0) {
        const conditions = topicFilters.map((t: string) => 
          `preferences->>'topics' LIKE '%${t}%'`
        ).join(' OR ');
        countQuery += ` AND (${conditions})`;
      }
      if (frequencyFilter) {
        countQuery += ` AND preferences->>'frequency' = '${frequencyFilter}'`;
      }
      if (promotionsFilter !== null) {
        countQuery += ` AND (preferences->>'promotions')::boolean = ${promotionsFilter}`;
      }
    }

    const countResult = await sql.query(countQuery);

    return NextResponse.json({
      count: Number(countResult.rows[0]?.count) || 0,
      total: Number(totalResult?.total) || 0,
    });
  } catch (error) {
    console.error('Preview count error:', error);
    return NextResponse.json({ error: 'Failed to get count' }, { status: 500 });
  }
}
