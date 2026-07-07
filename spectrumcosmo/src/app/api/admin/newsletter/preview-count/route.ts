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

    let count = 0;

    if (audience === 'all') {
      // Get all confirmed subscribers
      const [result] = await sql`
        SELECT COUNT(*) as count FROM subscribers WHERE status = 'confirmed'
      `;
      count = Number(result?.count) || 0;
    } else if (audience === 'active') {
      // Get active subscribers (last 90 days)
      const [result] = await sql`
        SELECT COUNT(*) as count FROM subscribers 
        WHERE status = 'confirmed' AND confirmed_at > NOW() - INTERVAL '90 days'
      `;
      count = Number(result?.count) || 0;
    } else if (audience === 'segment') {
      // Build conditions for segment filtering
      let conditions: string[] = [];
      let query = `SELECT COUNT(*) as count FROM subscribers WHERE status = 'confirmed'`;

      if (topicFilters && topicFilters.length > 0) {
        // Check if preferences contains the topics
        const topicConditions = topicFilters.map((t: string) => 
          `preferences->>'topics' LIKE '%${t}%'`
        ).join(' OR ');
        conditions.push(`(${topicConditions})`);
      }

      if (frequencyFilter) {
        conditions.push(`preferences->>'frequency' = '${frequencyFilter}'`);
      }

      if (promotionsFilter !== null) {
        conditions.push(`(preferences->>'promotions')::boolean = ${promotionsFilter}`);
      }

      if (conditions.length > 0) {
        query += ` AND ${conditions.join(' AND ')}`;
      }

      // Execute the query using tagged template
      const [result] = await sql`
        SELECT COUNT(*) as count FROM subscribers 
        WHERE status = 'confirmed' 
        AND (${conditions.length > 0 ? conditions.join(' AND ') : '1=1'})
      `;
      count = Number(result?.count) || 0;
    }

    return NextResponse.json({
      count: count,
      total: Number(totalResult?.total) || 0,
    });
  } catch (error) {
    console.error('Preview count error:', error);
    return NextResponse.json({ error: 'Failed to get count' }, { status: 500 });
  }
}
