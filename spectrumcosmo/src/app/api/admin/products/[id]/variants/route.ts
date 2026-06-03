// app/api/admin/products/[id]/variants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;
  
  const sql = getDb();
  const variants = await sql`
    SELECT * FROM product_variants 
    WHERE product_id = ${params.id}
    ORDER BY display_order ASC
  `;
  return NextResponse.json(variants);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;
  
  const { size, color, price_override, compare_price_override, stock_quantity, sku, image_url, display_order } = await req.json();
  
  const sql = getDb();
  const result = await sql`
    INSERT INTO product_variants (product_id, size, color, price_override, compare_price_override, stock_quantity, sku, image_url, display_order)
    VALUES (${params.id}, ${size || null}, ${color || null}, ${price_override || null}, ${compare_price_override || null}, ${stock_quantity || 0}, ${sku || null}, ${image_url || null}, ${display_order || 0})
    RETURNING *
  `;
  return NextResponse.json(result[0]);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;
  
  const { variantId, size, color, price_override, compare_price_override, stock_quantity, sku, image_url, is_active, display_order } = await req.json();
  
  if (!variantId) {
    return NextResponse.json({ error: 'Variant ID required' }, { status: 400 });
  }
  
  const sql = getDb();
  const result = await sql`
    UPDATE product_variants SET
      size = COALESCE(${size}, size),
      color = COALESCE(${color}, color),
      price_override = COALESCE(${price_override}, price_override),
      compare_price_override = COALESCE(${compare_price_override}, compare_price_override),
      stock_quantity = COALESCE(${stock_quantity}, stock_quantity),
      sku = COALESCE(${sku}, sku),
      image_url = COALESCE(${image_url}, image_url),
      is_active = COALESCE(${is_active}, is_active),
      display_order = COALESCE(${display_order}, display_order),
      updated_at = NOW()
    WHERE id = ${variantId} AND product_id = ${params.id}
    RETURNING *
  `;
  return NextResponse.json(result[0]);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAdmin(req);
  if (authError) return authError;
  
  const url = new URL(req.url);
  const variantId = url.searchParams.get('variantId');
  
  if (!variantId) {
    return NextResponse.json({ error: 'Variant ID required' }, { status: 400 });
  }
  
  const sql = getDb();
  await sql`DELETE FROM product_variants WHERE id = ${variantId} AND product_id = ${params.id}`;
  return NextResponse.json({ success: true });
}
