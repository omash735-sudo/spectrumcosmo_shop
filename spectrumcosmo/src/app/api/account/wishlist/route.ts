import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getVerifiedUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req)
  if (error) {
    return NextResponse.json({ success: true, data: [], message: 'Not authenticated' }, { status: 200 })
  }

  try {
    const sql = getDb()
    const wishlist = await sql`
      SELECT 
        w.id,
        w.product_id,
        p.name,
        p.price,
        p.image_url AS image,
        p.stock_quantity > 0 AS in_stock
      FROM wishlist w
      JOIN products p ON p.id = w.product_id
      WHERE w.user_id = ${user.id}
      ORDER BY w.added_at DESC
    `
    return NextResponse.json({ success: true, data: wishlist || [] })
  } catch (err: any) {
    console.error('Wishlist error:', err)
    return NextResponse.json({ success: false, data: [], error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req)
  if (error) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { productId } = await req.json()
    if (!productId) {
      return NextResponse.json({ success: false, error: 'productId required' }, { status: 400 })
    }
    
    const sql = getDb()
    
    // Check if product exists
    const [product] = await sql`SELECT id FROM products WHERE id = ${productId}`
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }
    
    await sql`
      INSERT INTO wishlist (user_id, product_id, added_at)
      VALUES (${user.id}, ${productId}, NOW())
      ON CONFLICT (user_id, product_id) DO NOTHING
    `
    
    // Get updated wishlist count
    const [countResult] = await sql`
      SELECT COUNT(*) as count FROM wishlist WHERE user_id = ${user.id}
    `
    
    return NextResponse.json({ 
      success: true, 
      message: 'Added to wishlist',
      count: parseInt(countResult?.count || '0')
    })
  } catch (err: any) {
    console.error('Wishlist POST error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req)
  if (error) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { productId } = await req.json()
    if (!productId) {
      return NextResponse.json({ success: false, error: 'productId required' }, { status: 400 })
    }
    
    const sql = getDb()
    await sql`
      DELETE FROM wishlist
      WHERE user_id = ${user.id} AND product_id = ${productId}
    `
    
    // Get updated wishlist count
    const [countResult] = await sql`
      SELECT COUNT(*) as count FROM wishlist WHERE user_id = ${user.id}
    `
    
    return NextResponse.json({ 
      success: true, 
      message: 'Removed from wishlist',
      count: parseInt(countResult?.count || '0')
    })
  } catch (err: any) {
    console.error('Wishlist DELETE error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
