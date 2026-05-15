import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = parseInt(searchParams.get('limit') || '5');

  try {
    const sql = getDb();
    const products = await sql`
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
    return NextResponse.json(products);
  } catch (err) {
    console.error('Failed to fetch top products:', err);
    return NextResponse.json([]);
  }
}
