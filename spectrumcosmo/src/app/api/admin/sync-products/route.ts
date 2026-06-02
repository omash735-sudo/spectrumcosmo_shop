import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import algoliasearch from 'algoliasearch';

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY!;
const productsIndex = 'products';

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    // Initialize Algolia client (v5 syntax)
    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
    const index = client.initIndex(productsIndex);

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

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No products found to sync',
      });
    }

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
