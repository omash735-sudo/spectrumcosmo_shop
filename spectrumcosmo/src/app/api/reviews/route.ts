import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { getUserFromRequest } from '@/lib/userAuth'

// POST – Submit a new review (logged-in users only)
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'You must be logged in to submit a review' }, { status: 401 })
    }

    const { review_text, rating, image_url, product_id } = await req.json()
    if (!review_text || !rating) {
      return NextResponse.json({ error: 'Review text and rating are required' }, { status: 400 })
    }

    const r = parseInt(rating)
    if (r < 1 || r > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
    }

    const sql = getDb()
    const [data] = await sql`
      INSERT INTO reviews (customer_name, user_id, review_text, rating, image_url, product_id, status, created_at, updated_at)
      VALUES (${user.name}, ${user.id}, ${review_text}, ${r}, ${image_url || null}, ${product_id || null}, 'pending', NOW(), NOW())
      RETURNING *
    `

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET – Public: approved reviews; Admin: all reviews; also filter by product_id
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const productId = url.searchParams.get('product_id')
    const userOnly = url.searchParams.get('user_id') // for "My Reviews" on user side
    const isAdmin = !requireAdmin(req)  // assuming requireAdmin returns error if not admin

    const sql = getDb()
    let data

    if (productId) {
      // For product page – only approved reviews
      data = await sql`
        SELECT r.*, u.name as user_name, u.email 
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.product_id = ${productId} AND r.status = 'approved'
        ORDER BY r.created_at DESC
      `
    } else if (userOnly && !isAdmin) {
      // Logged-in user requests their own reviews with status
      const user = getUserFromRequest(req)
      if (!user || user.id !== userOnly) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      data = await sql`
        SELECT r.*, p.name as product_name
        FROM reviews r
        LEFT JOIN products p ON r.product_id = p.id
        WHERE r.user_id = ${user.id}
        ORDER BY r.created_at DESC
      `
    } else if (isAdmin) {
      // Admin sees all reviews (with user info)
      data = await sql`
        SELECT r.*, u.name as user_name, u.email, u.profile_image as user_image
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
      `
    } else {
      // Public – only approved reviews
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

// PATCH – Admin only: update status, review_text, rating, image_url
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

// DELETE – Admin only
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
