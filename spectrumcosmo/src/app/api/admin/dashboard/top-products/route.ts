import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const revalidate = 300; // Cache for 5 minutes
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 10);
  const start = performance.now();

  try {
    const sql = getDb();
    
    // Try materialized view first, fallback to regular query
    let products;
    try {
      products = await sql`
        SELECT id, product_name, view_count
        FROM mv_most_viewed_products
        ORDER BY view_count DESC
        LIMIT ${limit}
      `;
    } catch {
      // Fallback if materialized view doesn't exist
      products = await sql`
        SELECT 
          p.id,
          p.name as product_name,
          COUNT(pv.id) as view_count
        FROM products p
        LEFT JOIN product_views pv ON p.id = pv.product_id
        GROUP BY p.id, p.name
        ORDER BY view_count DESC
        LIMIT ${limit}
      `;
    }
    
    const end = performance.now();
    console.log(`Top Products took ${(end - start).toFixed(0)}ms`);
    
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 's-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (err) {
    console.error('Failed to fetch top products:', err);
    return NextResponse.json([]);
  }
}
