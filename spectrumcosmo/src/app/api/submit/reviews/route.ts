import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

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
    console.log('=== STEP 1: Getting user ===');
    const payload = getUserFromRequest(req);
    console.log('=== STEP 2: Payload received ===');
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('=== STEP 3: Rate limiting ===');
    const rateLimitResult = await rateLimit(`review:${payload.id}`, 5, 3600);
    console.log('=== STEP 4: Rate limit passed ===');
    
    if (!rateLimitResult.success) {
      const minutesLeft = Math.ceil(rateLimitResult.retryAfterMinutes);
      return NextResponse.json(
        { error: `Too many reviews. Please try again in ${minutesLeft} minutes.` },
        { status: 429 }
      );
    }

    console.log('=== STEP 5: Parsing body ===');
    const body = await req.json();
    console.log('=== STEP 6: Body parsed ===');
    
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

    console.log('=== STEP 7: Sanitizing ===');
    const sanitizedText = sanitizeInput(review_text);
    const sanitizedName = payload?.name ? sanitizeInput(payload.name) : 'Anonymous User';
    const sanitizedImageUrl = image_url ? sanitizeInput(image_url).slice(0, 500) : null;

    const now = new Date().toISOString();
    console.log('=== STEP 8: Connecting to PG ===');

    const client = await pool.connect();
    console.log('=== STEP 9: PG connected ===');

    try {
      console.log('=== STEP 10: Running INSERT ===');
      const result = await client.query(
        `INSERT INTO reviews (customer_name, review_text, rating, image_url, product_id, user_id, status, approved, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, customer_name, review_text, rating, image_url, product_id, user_id, status, approved, created_at, updated_at`,
        [
          sanitizedName,
          sanitizedText,
          r,
          sanitizedImageUrl,
          product_id || null,
          String(payload.id),
          'pending',
          false,
          now,
          now
        ]
      );
      console.log('=== STEP 11: INSERT done ===');

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Failed to submit review' },
          { status: 500 }
        );
      }

      console.log('=== STEP 12: Returning result ===');
      return NextResponse.json(result.rows[0], { status: 201 });
    } finally {
      client.release();
      console.log('=== STEP 13: PG released ===');
    }
  } catch (err) {
    console.error('=== ERROR ===');
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
