// src/app/api/account/wishlist/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserFromRequest } from '@/lib/userAuth'

// GET /api/account/wishlist – fetch user's wishlist
export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const sql = getDb()
    const wishlist = await sql`
      SELECT 
        w.id,
        p.name,
        p.price,
        p.rating,
        p.image_url AS image,
        p.stock_quantity > 0 AS in_stock
      FROM wishlist w
      JOIN products p ON p.id = w.product_id
      WHERE w.user_id = ${user.id}
      ORDER BY w.added_at DESC
    `
    return NextResponse.json(wishlist)
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/account/wishlist – add item to wishlist
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { productId } = await req.json()
    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 })
    }

    const sql = getDb()
    await sql`
      INSERT INTO wishlist (user_id, product_id)
      VALUES (${user.id}, ${productId})
      ON CONFLICT (user_id, product_id) DO NOTHING
    `
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/account/wishlist – remove item (optional)
export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { productId } = await req.json()
    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 })
    }

    const sql = getDb()
    await sql`
      DELETE FROM wishlist
      WHERE user_id = ${user.id} AND product_id = ${productId}
    `
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
