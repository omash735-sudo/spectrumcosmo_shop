import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne, queryAsArray } from '@/lib/db';
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

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const sql = getDb();
    const data = await queryAsArray`
      SELECT r.*, u.name as user_name, u.email, u.profile_image as user_image
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `;

    const sanitizedData = (data as any[]).map((review: any) => ({
      ...review,
      review_text: sanitizeInput(review.review_text),
      customer_name: review.customer_name ? sanitizeInput(review.customer_name) : review.customer_name,
    }));

    return NextResponse.json(sanitizedData);
  } catch (err) {
    console.error('Admin reviews GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { id, status, review_text, rating, image_url } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const sql = getDb();
    const sanitizedText = review_text ? sanitizeInput(review_text) : undefined;
    const sanitizedImageUrl = image_url ? sanitizeInput(image_url).slice(0, 500) : undefined;
    const sanitizedRating = rating ? parseInt(rating) : undefined;

    const updatedReview = await queryOne`
      UPDATE reviews
      SET
        status = COALESCE(${status || null}, status),
        review_text = COALESCE(${sanitizedText || null}, review_text),
        rating = COALESCE(${sanitizedRating || null}, rating),
        image_url = COALESCE(${sanitizedImageUrl || null}, image_url),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    if (!updatedReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json(updatedReview);
  } catch (err) {
    console.error('Admin reviews PATCH error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const sql = getDb();
    const deleted = await queryOne<{ id: string }>`
      DELETE FROM reviews WHERE id = ${id}
      RETURNING id
    `;

    if (!deleted) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin reviews DELETE error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
