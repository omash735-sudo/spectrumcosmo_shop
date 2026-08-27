import { NextResponse } from 'next/server';
import { queryAsArray } from '@/lib/db';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  try {
    const categories = await queryAsArray<any>`
      SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.image_url, 
        c.is_active, 
        c.sort_order, 
        c.created_at, 
        c.updated_at,
        COUNT(p.id)::int as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.status = 'in_stock'
      WHERE c.is_active = true
      GROUP BY c.id
      ORDER BY c.sort_order ASC, c.name ASC
    `;
    return NextResponse.json(categories, { headers: corsHeaders });
  } catch (err) {
    console.error('Failed to fetch categories:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
