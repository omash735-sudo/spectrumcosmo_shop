import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { getVerifiedUser } from '@/lib/auth';
import { verifyCsrfToken } from '@/lib/csrf';
import { rateLimit } from '@/lib/rate-limit';

// =============================================
// INPUT SANITIZATION
// =============================================
function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '')           // Remove < and > to prevent HTML injection
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;')
    .replace(/\$/g, '&#36;')
    .trim()
    .slice(0, 2000);                // Max length limit
}

function sanitizeProductId(productId: string | null): string | null {
  if (!productId) return null;
  // Only allow alphanumeric, dash, underscore
  const cleaned = productId.replace(/[^a-zA-Z0-9\-_]/g, '');
  return cleaned || null;
}

// =============================================
// POST - Create a review (with CSRF protection)
// =============================================
export async function POST(req: NextRequest) {
  // CSRF Protection
  if (!verifyCsrfToken(req)) {
    return NextResponse.json({ error: 'CSRF token missing or invalid' }, { status: 403 });
  }

  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  // Rate limiting per user
  const rateLimitResult = await rateLimit(`review:${user.id}`, 5, 3600);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: `Too many reviews. Please try again in ${Math.ceil((rateLimitResult.reset - Date.now() / 1000) / 60)} minutes` },
      { status: 429 }
    );
  }

  try {
    const { review_text, rating, image_url, product_id } = await req.json();
    
    // Validate required fields
    if (!review_text || !rating) {
      return NextResponse.json({ error: 'Review text and rating are required' }, { status: 400 });
    }
    
    // Validate rating
    const r = parseInt(rating);
    if (isNaN(r) || r < 1 || r > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
    }
    
    // Validate review text length
    if (review_text.length < 3) {
      return NextResponse.json({ error: 'Review must be at least 3 characters' }, { status: 400 });
    }
    if (review_text.length > 2000) {
      return NextResponse.json({ error: 'Review cannot exceed 2000 characters' }, { status: 400 });
    }
    
    // SANITIZE ALL INPUTS
    const sanitizedText = sanitizeInput(review_text);
    const sanitizedName = user?.name ? sanitizeInput(user.name) : 'Anonymous User';
    const sanitizedProductId = sanitizeProductId(product_id);
    const sanitizedImageUrl = image_url ? sanitizeInput(image_url).slice(0, 500) : null;
    
    const sql = getDb();
    const [data] = await sql`
      INSERT INTO reviews (customer_name, user_id, review_text, rating, image_url, product_id, status, created_at, updated_at)
      VALUES (${sanitizedName}, ${user.id}, ${sanitizedText}, ${r}, ${sanitizedImageUrl}, ${sanitizedProductId}, 'pending', NOW(), NOW())
      RETURNING *
    `;
    
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Review POST error:', err);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}

// =============================================
// GET - Fetch reviews
// =============================================
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get('product_id');
    const userId = url.searchParams.get('user_id');
    
    // Check if this is an admin request
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
      // Sanitize product ID
      const sanitizedProductId = sanitizeProductId(productId);
      // Get approved reviews for a specific product
      data = await sql`
        SELECT r.*, u.name as user_name, u.email 
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.product_id = ${sanitizedProductId} AND r.status = 'approved'
        ORDER BY r.created_at DESC
      `;
    } else if (userId) {
      // Get reviews for a specific user
      const { user, error } = await getVerifiedUser(req);
      if (error) return error;
      
      // Verify user is requesting their own reviews
      if (user.id !== parseInt(userId)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      data = await sql`
        SELECT r.*, p.name as product_name
        FROM reviews r
        LEFT JOIN products p ON r.product_id = p.id
        WHERE r.user_id = ${user.id}
        ORDER BY r.created_at DESC
      `;
    } else if (isAdmin) {
      // Admin sees all reviews
      data = await sql`
        SELECT r.*, u.name as user_name, u.email, u.profile_image as user_image
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
      `;
    } else {
      // Public sees only approved reviews
      data = await sql`
        SELECT r.*, u.name as user_name
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.status = 'approved'
        ORDER BY r.created_at DESC
      `;
    }

    // Sanitize output data (prevent XSS in responses)
    const sanitizedData = data.map((review: any) => ({
      ...review,
      review_text: sanitizeInput(review.review_text),
      customer_name: review.customer_name ? sanitizeInput(review.customer_name) : review.customer_name,
    }));

    return NextResponse.json(sanitizedData);
  } catch (err: any) {
    console.error('Review GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// =============================================
// PATCH - Admin update review (with CSRF)
// =============================================
export async function PATCH(req: NextRequest) {
  // CSRF Protection
  if (!verifyCsrfToken(req)) {
    return NextResponse.json({ error: 'CSRF token missing or invalid' }, { status: 403 });
  }

  const authError = requireAdmin(req);
  if (authError) return authError;
  
  try {
    const { id, status, review_text, rating, image_url } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    
    const sql = getDb();
    
    // Sanitize inputs if provided
    const sanitizedText = review_text ? sanitizeInput(review_text) : undefined;
    const sanitizedImageUrl = image_url ? sanitizeInput(image_url).slice(0, 500) : undefined;
    const sanitizedRating = rating ? parseInt(rating) : undefined;
    
    const [data] = await sql`
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
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// =============================================
// PUT - User edit their own pending review (with CSRF)
// =============================================
export async function PUT(req: NextRequest) {
  // CSRF Protection
  if (!verifyCsrfToken(req)) {
    return NextResponse.json({ error: 'CSRF token missing or invalid' }, { status: 403 });
  }

  const { user, error } = await getVerifiedUser(req);
  if (error) return error;

  try {
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
    
    // First check if review exists, belongs to user, and is pending
    const [existingReview] = await sql`
      SELECT * FROM reviews WHERE id = ${id} AND user_id = ${user.id}
    `;
    
    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    
    if (existingReview.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending reviews can be edited' }, { status: 403 });
    }
    
    // Sanitize inputs
    const sanitizedText = sanitizeInput(review_text);
    const sanitizedImageUrl = image_url ? sanitizeInput(image_url).slice(0, 500) : null;
    
    // Update the review
    const [updated] = await sql`
      UPDATE reviews
      SET 
        review_text = ${sanitizedText},
        rating = ${r},
        image_url = ${sanitizedImageUrl},
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING *
    `;
    
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// =============================================
// DELETE - Admin delete review
// =============================================
export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;
  
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    
    const sql = getDb();
    await sql`DELETE FROM reviews WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
