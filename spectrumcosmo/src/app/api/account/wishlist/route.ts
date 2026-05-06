import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserFromRequest } from '@/lib/userAuth'

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
