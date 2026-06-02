// app/api/admin/sync-products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { adminClient, productsIndex } from '@/lib/algolia';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const sql = getDb();
    
    // Get all active products
    const products = await sql`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.currency,
        p.image_url,
        p.category_id,
        p.status,
        p.stock_quantity,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.status = 'in_stock'
    `;

    // Format for Algolia
    const algoliaObjects = products.map((p: any) => ({
      objectID: p.id,
      id: p.id,
      name: p.name,
      description: p.description || '',
      price: p.price,
      currency: p.currency || 'MWK',
      image_url: p.image_url,
      category_id: p.category_id,
      category_name: p.category_name,
      stock_quantity: p.stock_quantity,
    }));

    // Send to Algolia
    const index = adminClient.initIndex(productsIndex);
    const result = await index.replaceAllObjects(algoliaObjects);

    return NextResponse.json({
      success: true,
      message: `Synced ${algoliaObjects.length} products to Algolia`,
      result,
    });
  } catch (err: any) {
    console.error('Sync error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
