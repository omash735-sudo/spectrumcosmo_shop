import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryAsArray } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

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

export async function POST(req: NextRequest) {
  try {
    // Get user directly from token without extra DB query
    const payload = getUserFromRequest(req);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('=== PAYLOAD FROM TOKEN ===');
    console.log('Payload:', payload);
    console.log('Payload ID:', payload.id);
    console.log('Payload ID type:', typeof payload.id);

    const rateLimitResult = await rateLimit(`review:${payload.id}`, 5, 3600);
    if (!rateLimitResult.success) {
      const minutesLeft = Math.ceil(rateLimitResult.retryAfterMinutes);
      return NextResponse.json(
        { error: `Too many reviews. Please try again in ${minutesLeft} minutes.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { review_text, rating, image_url, product_id } = body;

    if (!review_text || !rating) {
      return NextResponse.json(
        { error: 'Review text and rating are required' },
        { status: 400 }
      );
    }

    const r = parseInt(rating);
    if (isNaN(r) || r < 1 || r > 5) {
      return NextResponse.json(
        { error: 'Rating must be 1-5' },
        { status: 400 }
      );
    }
    if (review_text.length < 3) {
      return NextResponse.json(
        { error: 'Review must be at least 3 characters' },
        { status: 400 }
      );
    }
    if (review_text.length > 2000) {
      return NextResponse.json(
        { error: 'Review cannot exceed 2000 characters' },
        { status: 400 }
      );
    }

    const sanitizedText = sanitizeInput(review_text);
    const sanitizedName = payload?.name ? sanitizeInput(payload.name) : 'Anonymous User';
    const sanitizedImageUrl = image_url ? sanitizeInput(image_url).slice(0, 500) : null;

    const now = new Date().toISOString();

    // Use the ID directly from the token
    const userId = String(payload.id);

    console.log('=== INSERTING REVIEW ===');
    console.log('User ID from token:', userId);

    await queryOne`
      INSERT INTO reviews (customer_name, review_text, rating, image_url, product_id, user_id, status, approved, created_at, updated_at)
      VALUES (${sanitizedName}, ${sanitizedText}, ${r}, ${sanitizedImageUrl}, ${product_id || null}, ${userId}, 'pending', false, ${now}, ${now})
    `;

    const reviews = await queryAsArray`
      SELECT id, customer_name, review_text, rating, image_url, product_id, user_id, status, approved, created_at, updated_at
      FROM reviews 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    if (!reviews || reviews.length === 0) {
      return NextResponse.json(
        { error: 'Failed to retrieve submitted review' },
        { status: 500 }
      );
    }

    return NextResponse.json(reviews[0], { status: 201 });
  } catch (err) {
    console.error('Submit review error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
