import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { getUserFromRequest } from '@/lib/auth';

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
    const payload = getUserFromRequest(req);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
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

    const client = await pool.connect();

    try {
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

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Failed to submit review' },
          { status: 500 }
        );
      }

      return NextResponse.json(result.rows[0], { status: 201 });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Submit review error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
