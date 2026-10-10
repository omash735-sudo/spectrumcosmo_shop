import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const category = url.searchParams.get('category');
  const q = url.searchParams.get('q');

  // Filtering is done in SQL, BEFORE the LIMIT. Previously the newest 100
  // products were fetched first and filtered afterwards, so any product
  // outside those 100 could never appear in a search or category view.
  //
  // Values are passed as bound parameters (never concatenated into the
  // SQL). An empty string means "no filter" for that field.
  const categoryFilter = category && category !== 'All' ? category : '';
  const searchTerm = (q ?? '').trim();
  // Escape LIKE wildcards so "100%" or "a_b" match literally, the same
  // way the old JS `.includes()` did.
  const searchPattern = `%${searchTerm.replace(/[\\%_]/g, '\\$&')}%`;

  try {
    const sql = getDb();

    const products = await queryAsArray<any>`
      SELECT p.*, c.name as category_name,
             COALESCE(r.avg_rating, 0) AS avg_rating,
             COALESCE(r.review_count, 0) AS review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN (
        SELECT product_id,
               ROUND(AVG(rating)::numeric, 2)::float AS avg_rating,
               COUNT(*)::int AS review_count
        FROM reviews
        WHERE status = 'approved'
        GROUP BY product_id
      ) r ON r.product_id = p.id
      WHERE p.status = 'in_stock'
        AND (${categoryFilter} = '' OR c.name = ${categoryFilter})
        AND (
          ${searchTerm} = ''
          OR p.name ILIKE ${searchPattern}
          OR p.description ILIKE ${searchPattern}
        )
      ORDER BY p.created_at DESC
      LIMIT 100
    `;

    return NextResponse.json(products, { headers: corsHeaders });

  } catch (error) {
    console.error('Public products API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500, headers: corsHeaders }
    );
  }
}
