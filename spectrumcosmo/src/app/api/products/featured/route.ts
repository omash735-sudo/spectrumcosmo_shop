// app/api/products/featured/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const featured = await sql`
      SELECT id, name, price, compare_price, image_url
      FROM products 
      WHERE is_featured = true AND status = 'in_stock'
      ORDER BY created_at DESC 
      LIMIT 8
    `;
    return NextResponse.json(featured);
  } catch (err: any) {
    console.error('Featured products error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
