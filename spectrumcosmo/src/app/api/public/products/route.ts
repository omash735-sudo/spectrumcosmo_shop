import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const category = url.searchParams.get('category');
  const q = url.searchParams.get('q');

  try {
    const sql = getDb();

    // Fetch all in-stock products with category info
    const products = await queryAsArray<any>`
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'in_stock'
      ORDER BY p.created_at DESC
      LIMIT 100
    `;

    // Filter in JavaScript
    let filtered = products;

    if (category && category !== 'All') {
      filtered = filtered.filter(p => p.category_name === category);
    }

    if (q) {
      const searchLower = q.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Public products API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
