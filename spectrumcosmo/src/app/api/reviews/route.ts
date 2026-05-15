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
    
    // FIXED: Provide a fallback for customer_name
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
    const userOnly = url.searchParams.get('user_id')
    const isAdmin = !requireAdmin(req)

    const sql = getDb()
    let data

    if (productId) {
      data = await sql`
        SELECT r.*, u.name as user_name, u.email 
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.product_id = ${productId} AND r.status = 'approved'
        ORDER BY r.created_at DESC
      `
    } else if (userOnly && !isAdmin) {
      const { user, error } = await getVerifiedUser(req)
      if (error) return error
      if (user.id !== userOnly) {
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
      data = await sql`
        SELECT r.*, u.name as user_name, u.email, u.profile_image as user_image
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
      `
    } else {
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
