import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { getVerifiedUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req)
  if (error) return error

  try {
    const { review_text, rating, image_url, product_id } = await req.json()
    if (!review_text || !rating) {
      return NextResponse.json({ error: 'Review text and rating are required' }, { status: 400 })
    }
    const r = parseInt(rating)
    if (r < 1 || r > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
    }
    
    // Provide a fallback for customer_name
    const customerName = user?.name || user?.email?.split('@')[0] || 'Anonymous User'
    
    const sql = getDb()
    const [data] = await sql`
      INSERT INTO reviews (customer_name, user_id, review_text, rating, image_url, product_id, status, created_at, updated_at)
      VALUES (${customerName}, ${user.id}, ${review_text}, ${r}, ${image_url || null}, ${product_id || null}, 'pending', NOW(), NOW())
      RETURNING *
    `
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const productId = url.searchParams.get('product_id')
    const userId = url.searchParams.get('user_id')
    const isAdmin = !requireAdmin(req)

    const sql = getDb()
    let data

    if (productId) {
      // Get approved reviews for a specific product
      data = await sql`
        SELECT r.*, u.name as user_name, u.email 
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.product_id = ${productId} AND r.status = 'approved'
        ORDER BY r.created_at DESC
      `
    } else if (userId) {
      // Get reviews for a specific user (for "My Reviews" tab)
      const { user, error } = await getVerifiedUser(req)
      if (error) return error
      
      // Verify user is requesting their own reviews
      if (user.id !== parseInt(userId)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      // Return ALL user's reviews (pending, approved, denied) for "My Reviews"
      data = await sql`
        SELECT r.*, p.name as product_name
        FROM reviews r
        LEFT JOIN products p ON r.product_id = p.id
        WHERE r.user_id = ${user.id}
        ORDER BY r.created_at DESC
      `
    } else if (isAdmin) {
      // Admin sees all reviews
      data = await sql`
        SELECT r.*, u.name as user_name, u.email, u.profile_image as user_image
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
      `
    } else {
      // Public sees only approved reviews
      data = await sql`
        SELECT r.*, u.name as user_name
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.status = 'approved'
        ORDER BY r.created_at DESC
      `
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  try {
    const { id, status, review_text, rating, image_url } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const sql = getDb()
    const [data] = await sql`
      UPDATE reviews
      SET
        status = COALESCE(${status || null}, status),
        review_text = COALESCE(${review_text || null}, review_text),
        rating = COALESCE(${rating ? parseInt(rating) : null}, rating),
        image_url = COALESCE(${image_url || null}, image_url),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ADD THIS - For users to edit their OWN pending reviews
export async function PUT(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req)
  if (error) return error

  try {
    const { id, review_text, rating, image_url } = await req.json()
    if (!id) return NextResponse.json({ error: 'Review ID required' }, { status: 400 })
    if (!review_text || !rating) {
      return NextResponse.json({ error: 'Review text and rating are required' }, { status: 400 })
    }

    const r = parseInt(rating)
    if (r < 1 || r > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
    }

    const sql = getDb()
    
    // First check if review exists, belongs to user, and is pending
    const [existingReview] = await sql`
      SELECT * FROM reviews WHERE id = ${id} AND user_id = ${user.id}
    `
    
    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }
    
    if (existingReview.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending reviews can be edited' }, { status: 403 })
    }
    
    // Update the review
    const [updated] = await sql`
      UPDATE reviews
      SET 
        review_text = ${review_text},
        rating = ${r},
        image_url = ${image_url || null},
        updated_at = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING *
    `
    
    return NextResponse.json(updated)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const sql = getDb()
    await sql`DELETE FROM reviews WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
