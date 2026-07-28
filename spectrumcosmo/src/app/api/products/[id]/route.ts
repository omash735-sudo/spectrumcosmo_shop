// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne, queryMany } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const sql = getDb();

    const product = await queryOne`
      SELECT * FROM products WHERE id = ${id}
    `;

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const reviews = await queryMany`
      SELECT * FROM reviews WHERE product_id = ${id} AND status = 'approved' ORDER BY created_at DESC LIMIT 20
    `;

    const variants = await queryMany`
      SELECT * FROM product_variants WHERE product_id = ${id} AND is_active = true ORDER BY display_order ASC
    `;

    const relatedProducts = await queryMany`
      SELECT * FROM products
      WHERE category_id = ${product.category_id} AND id != ${id} AND status = 'in_stock'
      ORDER BY created_at DESC LIMIT 4
    `;

    return NextResponse.json({
      product,
      reviews,
      variants,
      relatedProducts,
    });
  } catch (err) {
    console.error('Product API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
