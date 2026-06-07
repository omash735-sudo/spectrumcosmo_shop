// app/api/admin/products/[id]/variants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb, queryOne, queryMany } from '@/lib/db';

interface ProductVariant {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  price_override: number | null;
  compare_price_override: number | null;
  stock_quantity: number;
  sku: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: Date;
  updated_at: Date;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;
  
  const { id: productId } = await params;
  const variants = await queryMany<ProductVariant>`
    SELECT * FROM product_variants 
    WHERE product_id = ${productId}
    ORDER BY display_order ASC
  `;
  return NextResponse.json(variants);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;
  
  const { id: productId } = await params;
  const { size, color, price_override, compare_price_override, stock_quantity, sku, image_url, display_order } = await req.json();
  
  const newVariant = await queryOne<ProductVariant>`
    INSERT INTO product_variants (product_id, size, color, price_override, compare_price_override, stock_quantity, sku, image_url, display_order)
    VALUES (${productId}, ${size || null}, ${color || null}, ${price_override ?? null}, ${compare_price_override ?? null}, ${stock_quantity || 0}, ${sku || null}, ${image_url || null}, ${display_order ?? 0})
    RETURNING *
  `;
  
  if (!newVariant) {
    return NextResponse.json({ error: 'Failed to create variant' }, { status: 500 });
  }
  return NextResponse.json(newVariant, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;
  
  const { id: productId } = await params;
  const { variantId, size, color, price_override, compare_price_override, stock_quantity, sku, image_url, is_active, display_order } = await req.json();
  
  if (!variantId) {
    return NextResponse.json({ error: 'Variant ID required' }, { status: 400 });
  }
  
  const updated = await queryOne<ProductVariant>`
    UPDATE product_variants SET
      size = COALESCE(${size ?? null}, size),
      color = COALESCE(${color ?? null}, color),
      price_override = COALESCE(${price_override ?? null}, price_override),
      compare_price_override = COALESCE(${compare_price_override ?? null}, compare_price_override),
      stock_quantity = COALESCE(${stock_quantity ?? null}, stock_quantity),
      sku = COALESCE(${sku ?? null}, sku),
      image_url = COALESCE(${image_url ?? null}, image_url),
      is_active = COALESCE(${is_active ?? null}, is_active),
      display_order = COALESCE(${display_order ?? null}, display_order),
      updated_at = NOW()
    WHERE id = ${variantId} AND product_id = ${productId}
    RETURNING *
  `;
  
  if (!updated) {
    return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;
  
  const { id: productId } = await params;
  const url = new URL(req.url);
  const variantId = url.searchParams.get('variantId');
  
  if (!variantId) {
    return NextResponse.json({ error: 'Variant ID required' }, { status: 400 });
  }
  
  const result = await queryMany<{ id: string }>`
    DELETE FROM product_variants
    WHERE id = ${variantId} AND product_id = ${productId}
    RETURNING id
  `;
  
  if (result.length === 0) {
    return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
