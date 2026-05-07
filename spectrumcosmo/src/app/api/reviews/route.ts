import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { customer_name, review_text, rating, image_url, product_id } = await req.json()
    if (!customer_name || !review_text || !rating) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }
    const r = parseInt(rating)
    if (r < 1 || r > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
    }
    const sql = getDb()
    const [data] = await sql`
      INSERT INTO reviews (customer_name, review_text, rating, image_url, product_id, approved)
      VALUES (${customer_name}, ${review_text}, ${r}, ${image_url || null}, ${product_id || null}, false)
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
    const isAdmin = !requireAdmin(req)  // your admin check returns false if not admin

    const sql = getDb()
    let data

    if (productId) {
      // Fetch only approved reviews for a specific product
      data = await sql`
        SELECT * FROM reviews
        WHERE product_id = ${productId} AND approved = true
        ORDER BY created_at DESC
      `
    } else if (isAdmin) {
      // Admin sees all reviews (including unapproved)
      data = await sql`SELECT * FROM reviews ORDER BY created_at DESC`
    } else {
      // Public sees only approved reviews (all products)
      data = await sql`SELECT * FROM reviews WHERE approved = true ORDER BY created_at DESC`
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
    const { id, approved, review_text, rating } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const sql = getDb()
    const [data] = await sql`
      UPDATE reviews
      SET
        approved = COALESCE(${approved !== undefined ? approved : null}, approved),
        review_text = COALESCE(${review_text || null}, review_text),
        rating = COALESCE(${rating ? parseInt(rating) : null}, rating)
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
