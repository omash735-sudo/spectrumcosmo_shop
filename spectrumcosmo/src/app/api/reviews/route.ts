import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;')
    .replace(/\$/g, '&#36;')
    .trim()
    .slice(0, 2000);
}

function sanitizeProductId(productId: string | null): string | null {
  if (!productId) return null;
  return productId.replace(/[^a-zA-Z0-9\-_]/g, '') || null;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get('product_id');

    const sql = getDb();
    let data;

    if (productId) {
      const sanitizedProductId = sanitizeProductId(productId);
      data = await queryAsArray`
        SELECT r.*, u.name as user_name
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.product_id = ${sanitizedProductId} AND r.status = 'approved'
        ORDER BY r.created_at DESC
      `;
    } else {
      data = await queryAsArray`
        SELECT r.*, u.name as user_name
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.status = 'approved'
        ORDER BY r.created_at DESC
      `;
    }

    const sanitizedData = (data as any[]).map((review: any) => ({
      ...review,
      review_text: sanitizeInput(review.review_text),
      customer_name: review.customer_name ? sanitizeInput(review.customer_name) : review.customer_name,
    }));

    const response = NextResponse.json(sanitizedData);
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');

    return response;
  } catch (err) {
    console.error('Review GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
