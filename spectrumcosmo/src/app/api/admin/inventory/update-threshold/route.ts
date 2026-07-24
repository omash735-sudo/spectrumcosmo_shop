// app/api/admin/inventory/update-threshold/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { productId, threshold } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    if (threshold === undefined || threshold === null) {
      return NextResponse.json({ error: 'Threshold value required' }, { status: 400 });
    }

    if (typeof threshold !== 'number' || threshold < 0) {
      return NextResponse.json({ error: 'Threshold must be a positive number' }, { status: 400 });
    }

    const sql = getDb();

    const [product] = await sql`
      SELECT id FROM products WHERE id = ${productId}
    `;

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await sql`
      UPDATE products 
      SET low_stock_threshold = ${threshold}, updated_at = NOW()
      WHERE id = ${productId}
    `;

    return NextResponse.json({
      success: true,
      message: 'Low stock threshold updated successfully',
      productId,
      threshold
    });
  } catch (err: any) {
    console.error('Threshold update error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update threshold' },
      { status: 500 }
    );
  }
}
