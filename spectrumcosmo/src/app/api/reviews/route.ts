// app/api/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

// Same CORS policy as the other public GET routes, so the installed app
// (which runs on its own origin) can call this endpoint.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// React already escapes text when it renders it, so HTML-escaping here made
// customers see codes like "&#39;" for an apostrophe and "&#36;" for "$".
// What stays is a safety net for any place that might inject this text as
// HTML: tags are removed. Everything else is returned exactly as written.
function sanitizeInput(input: string): string {
  if (!input) return '';
  return String(input)
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 2000);
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get('product_id');
    const userId = url.searchParams.get('user_id');

    const sql = getDb();
    let data;
    let isOwner = false;

    if (productId) {
      data = await sql`
        SELECT r.*, u.name as user_name
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.product_id = ${productId} AND r.status = 'approved'
        ORDER BY r.created_at DESC
      `;
    } else if (userId) {
      // Only the signed-in owner may see their own reviews including the
      // ones still waiting for approval. Anyone else gets approved ones only.
      const { user: me } = await getVerifiedUser(req);
      isOwner = !!me && String(me.id) === String(userId);
      data = await sql`
        SELECT r.*, u.name as user_name
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.user_id = ${userId}
          AND (r.status = 'approved' OR ${isOwner})
        ORDER BY r.created_at DESC
      `;
    } else {
      data = await sql`
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

    const response = NextResponse.json(sanitizedData, { headers: corsHeaders });
    // The ?user_id= answer depends on who is signed in, so it must never sit
    // in a shared cache where another visitor could be served the owner's copy.
    response.headers.set(
      'Cache-Control',
      userId && !productId
        ? 'private, no-store'
        : 'public, s-maxage=300, stale-while-revalidate=60'
    );

    return response;
  } catch (err) {
    console.error('Review GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
