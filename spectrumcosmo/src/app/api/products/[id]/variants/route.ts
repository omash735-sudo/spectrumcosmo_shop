// app/api/products/[id]/variants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = getDb();
    const variants = await sql`
      SELECT * FROM product_variants 
      WHERE product_id = ${params.id} AND is_active = true
      ORDER BY display_order ASC
    `;
    return NextResponse.json(variants);
  } catch (err: any) {
    console.error('Variants fetch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
