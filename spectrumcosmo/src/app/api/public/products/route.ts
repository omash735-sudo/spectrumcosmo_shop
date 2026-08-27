// app/api/public/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const category = url.searchParams.get('category');
  const q = url.searchParams.get('q');

  try {
    const sql = getDb();

    // Use template literals with sql tag
    let query = sql`
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'in_stock'
    `;

    // For simple queries, just fetch all and filter in JavaScript
    // This is less efficient but works reliably
    let products = await queryAsArray<Product>(query);

    // Filter in JavaScript
    if (category) {
      products = products.filter(p => p.category_name === category);
    }

    if (q) {
      const searchLower = q.toLowerCase();
      products = products.filter(p => 
        p.name?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error('Public products API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
