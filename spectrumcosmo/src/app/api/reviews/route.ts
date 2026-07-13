import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne, queryAsArray } from '@/lib/db';
import { requireAdmin, getVerifiedUser } from '@/lib/auth';
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

function sanitizeProductId(productId: string | null): string | null {
  if (!productId) return null;
  return productId.replace(/[^a-zA-Z0-9\-_]/g, '') || null;
}

async function checkIsAdmin(userId: number): Promise<boolean> {
  try {
    const sql = getDb();
    const result = await queryOne<{ role: string }>`
      SELECT role FROM users WHERE id = ${userId}
    `;
    return result?.role === 'admin';
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await getVerifiedUser(req);
    
    if (!authResult.user || authResult.error) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { user } = authResult;

    const rateLimitResult = await rateLimit(`review:${user.id}`, 5, 3600);
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
    const sanitizedName = user?.name ? sanitizeInput(user.name) : 'Anonymous User';
    const sanitizedProductId = sanitizeProductId(product_id);
    const sanitizedImageUrl = image_url ? sanitizeInput(image_url).slice(0, 500) : null;

    const sql = getDb();
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    const newReview = await queryOne`
      INSERT INTO reviews (customer_name, user_id, review_text, rating, image_url, product_id, status, created_at, updated_at)
      VALUES (${sanitizedName}, ${user.id}, ${sanitizedText}, ${r}, ${sanitizedImageUrl}, ${sanitizedProductId}, 'pending', ${now}, ${now})
      RETURNING *
    `;

    if (!newReview) {
      return NextResponse.json(
        { error: 'Failed to submit review' },
        { status: 500 }
      );
    }

    return NextResponse.json(newReview, { status: 201 });
  } catch (err) {
    console.error('Review POST error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get('product_id');
    const userId = url.searchParams.get('user_id');

    let isAdmin = false;
    try {
      const adminCheck = requireAdmin(req);
      isAdmin = !adminCheck;
    } catch {
      isAdmin = false;
    }

    const sql = getDb();
    let data;

    if (productId) {
      const sanitizedProductId = sanitizeProductId(productId);
      data = await queryAsArray`
        SELECT r.*, u.name as user_name, u.email 
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.product_id = ${sanitizedProductId} AND r.status = 'approved'
        ORDER BY r.created_at DESC
      `;
    } else if (userId) {
      const authResult = await getVerifiedUser(req);
      if (!authResult.user || authResult.error) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      const { user } = authResult;
      const requestedId = parseInt(userId);
      if (isNaN(requestedId)) {
        return NextResponse.json(
          { error: 'Invalid user ID' },
          { status: 400 }
        );
      }
      
      const isOwnReview = user.id === requestedId;
      const isAdminUser = await checkIsAdmin(user.id);
      
      if (!isOwnReview && !isAdminUser) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      data = await queryAsArray`
        SELECT r.*, p.name as product_name
        FROM reviews r
        LEFT JOIN products p ON r.product_id = p.id
        WHERE r.user_id = ${requestedId}
        ORDER BY r.created_at DESC
      `;
    } else if (isAdmin) {
      data = await queryAsArray`
        SELECT r.*, u.name as user_name, u.email, u.profile_image as user_image
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
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
    
    if (!userId && !productId) {
      response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
    } else if (productId) {
      response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    } else {
      response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    }

    return response;
  } catch (err) {
    console.error('Review GET error:', err);
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
    console.error('Review PATCH error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await getVerifiedUser(req);
    
    if (!authResult.user || authResult.error) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { user } = authResult;

    const { id, review_text, rating, image_url } = await req.json();
    if (!id) return NextResponse.json({ error: 'Review ID required' }, { status: 400 });
    if (!review_text || !rating) {
      return NextResponse.json({ error: 'Review text and rating are required' }, { status: 400 });
    }

    const r = parseInt(rating);
    if (isNaN(r) || r < 1 || r > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
    }
    if (review_text.length < 3) {
      return NextResponse.json({ error: 'Review must be at least 3 characters' }, { status: 400 });
    }

    const sql = getDb();

    const existingReview = await queryOne<{ status: string }>`
      SELECT status FROM reviews WHERE id = ${id} AND user_id = ${user.id}
    `;
    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    if (existingReview.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending reviews can be edited' }, { status: 403 });
    }

    const sanitizedText = sanitizeInput(review_text);
    const sanitizedImageUrl = image_url ? sanitizeInput(image_url).slice(0, 500) : null;

    const updatedReview = await queryOne`
      UPDATE reviews
      SET 
        review_text = ${sanitizedText},
        rating = ${r},
        image_url = ${sanitizedImageUrl},
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING *
    `;

    if (!updatedReview) {
      return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
    }

    return NextResponse.json(updatedReview);
  } catch (err) {
    console.error('Review PUT error:', err);
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
    console.error('Review DELETE error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
