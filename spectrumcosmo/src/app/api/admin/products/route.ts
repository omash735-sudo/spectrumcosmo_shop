// app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryOne, queryMany, queryAsArray } from '@/lib/db';

// Types
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  currency: string;
  image_url: string | null;
  category_id: string | null;
  status: string;
  stock_quantity: number;
  is_featured: boolean;
  created_at: Date;
  updated_at: Date;
  category_name?: string;
  variant_count?: number;
}

interface CreateProductBody {
  name: string;
  description?: string;
  price_mwk: number;
  compare_price_mwk?: number;
  image_url?: string;
  category_id: string;
  status?: string;
  stock_quantity?: number;
  is_featured?: boolean;
}

interface UpdateProductBody extends Partial<CreateProductBody> {
  id: string;
}

// Helper for consistent error responses
function handleError(err: unknown): NextResponse {
  console.error('Products API error:', err);
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err instanceof Error ? err.message : 'Unknown error';
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const products = await queryMany<Product>`
      SELECT 
        p.*, 
        c.name as category_name,
        (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id) as variant_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `;
    return NextResponse.json(products);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body: CreateProductBody = await req.json();
    const {
      name,
      description,
      price_mwk,
      compare_price_mwk,
      image_url,
      category_id,
      status,
      stock_quantity,
      is_featured,
    } = body;

    if (!name || !price_mwk || !category_id) {
      return NextResponse.json(
        { error: 'Name, price and category required' },
        { status: 400 }
      );
    }

    const newProduct = await queryOne<Product>`
      INSERT INTO products (
        name, description, price, compare_price,
        currency, image_url, category_id, status,
        stock_quantity, is_featured
      ) VALUES (
        ${name}, ${description ?? ''}, ${price_mwk}, ${compare_price_mwk ?? null},
        'MWK', ${image_url ?? ''}, ${category_id}, ${status ?? 'in_stock'},
        ${stock_quantity ?? 0}, ${is_featured ?? false}
      )
      RETURNING *
    `;

    if (!newProduct) {
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    return NextResponse.json(newProduct, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const body: UpdateProductBody = await req.json();
    const {
      id,
      name,
      description,
      price_mwk,
      compare_price_mwk,
      image_url,
      category_id,
      status,
      stock_quantity,
      is_featured,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    const updatedProduct = await queryOne<Product>`
      UPDATE products SET
        name = COALESCE(${name ?? null}, name),
        description = COALESCE(${description ?? null}, description),
        price = COALESCE(${price_mwk ?? null}, price),
        compare_price = COALESCE(${compare_price_mwk ?? null}, compare_price),
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
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    // Delete variants first (foreign key constraint)
    await queryMany`DELETE FROM product_variants WHERE product_id = ${id}`;
    const deleteResult = await queryMany<{ id: string }>`
      DELETE FROM products WHERE id = ${id}
      RETURNING id
    `;

    if (deleteResult.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
