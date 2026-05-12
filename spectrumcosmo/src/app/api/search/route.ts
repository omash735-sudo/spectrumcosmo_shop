import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const sql = getDb();
    const products = await sql`
      SELECT id, name, price, image_url 
      FROM products 
      WHERE (name ILIKE ${'%' + q + '%'} OR description ILIKE ${'%' + q + '%'})
        AND status = 'in_stock'
      ORDER BY 
        CASE 
          WHEN name ILIKE ${q + '%'} THEN 1
          WHEN name ILIKE ${'%' + q + '%'} THEN 2
          ELSE 3
        END
      LIMIT 10
    `;
    return NextResponse.json(products);
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json([]);
  }
}
