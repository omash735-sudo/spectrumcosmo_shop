// app/api/products/featured/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Same CORS policy as /api/public/products, so the installed app can call it.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    // status + stock_quantity are required by ProductCard: without them every
    // featured card is treated as out of stock and loses its buttons.
    // Category name and ratings match the other product lists, so the card
    // needs no extra requests.
    const featured = await sql`
      SELECT p.id, p.name, p.price, p.compare_price, p.image_url,
             p.status, p.stock_quantity, c.name AS category_name,
             COALESCE(r.avg_rating, 0) AS avg_rating,
             COALESCE(r.review_count, 0) AS review_count
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN (
        SELECT product_id,
               ROUND(AVG(rating)::numeric, 2)::float AS avg_rating,
               COUNT(*)::int AS review_count
        FROM reviews
        WHERE status = 'approved'
        GROUP BY product_id
      ) r ON r.product_id = p.id
      WHERE p.is_featured = true AND p.status = 'in_stock'
      ORDER BY p.created_at DESC
      LIMIT 8
    `;
    return NextResponse.json(featured, {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err: any) {
    console.error('Featured products error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch featured products' },
      { status: 500, headers: corsHeaders }
    );
  }
}
