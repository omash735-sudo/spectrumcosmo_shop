import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 });
    }
    
    const sql = getDb();
    await sql`
      INSERT INTO product_views (product_id, viewed_at)
      VALUES (${productId}, NOW())
    `;
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to track product view:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
