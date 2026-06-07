// app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb, queryOne, queryAsArray } from '@/lib/db';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  category_id: string | null;
  status: string;
  stock_quantity: number;
  is_featured: boolean;
  created_at: Date;
  category_name?: string;
}

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const sql = getDb();
  const products = await queryAsArray<Product>`
    SELECT p.*, c.name as category_name 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC
  `;
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { name, description, price_mwk, image_url, category_id, status, stock_quantity, is_featured } = await req.json();

  if (!name || !price_mwk || !category_id) {
    return NextResponse.json({ error: 'Name, price and category required' }, { status: 400 });
  }

  const sql = getDb();
  const newProduct = await queryOne<Product>`
    INSERT INTO products (name, description, price, currency, image_url, category_id, status, stock_quantity, is_featured)
    VALUES (${name}, ${description || ''}, ${price_mwk}, 'MWK', ${image_url || ''}, ${category_id}, ${status || 'in_stock'}, ${stock_quantity || 0}, ${is_featured || false})
    RETURNING *
  `;

  if (!newProduct) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }

  return NextResponse.json(newProduct, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { id, name, description, price_mwk, image_url, category_id, status, stock_quantity, is_featured } = await req.json();

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  const sql = getDb();
  const updatedProduct = await queryOne<Product>`
    UPDATE products SET
      name = COALESCE(${name ?? null}, name),
      description = COALESCE(${description ?? null}, description),
      price = COALESCE(${price_mwk ?? null}, price),
      currency = 'MWK',
      image_url = COALESCE(${image_url ?? null}, image_url),
      category_id = COALESCE(${category_id ?? null}, category_id),
      status = COALESCE(${status ?? null}, status),
      stock_quantity = COALESCE(${stock_quantity ?? null}, stock_quantity),
      is_featured = COALESCE(${is_featured ?? null}, is_featured),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;

  if (!updatedProduct) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json(updatedProduct);
}

export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  const sql = getDb();
  await sql`DELETE FROM products WHERE id = ${id}`;
  return NextResponse.json({ success: true });
}
