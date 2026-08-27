// app/api/public/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';

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
  const sql = getDb();
  const url = new URL(req.url);
  const category = url.searchParams.get('category');
  const q = url.searchParams.get('q');

  let query = `
    SELECT p.*, c.name as category_name 
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'in_stock'
  `;

  const params: any[] = [];

  if (category) {
    query += ` AND c.name = $${params.length + 1}`;
    params.push(category);
  }

  if (q) {
    query += ` AND (p.name ILIKE $${params.length + 1} OR p.description ILIKE $${params.length + 1})`;
    params.push(`%${q}%`);
  }

  query += ` ORDER BY p.created_at DESC LIMIT 100`;

  try {
    const products = await queryAsArray<Product>(query, ...params);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Public products API error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
