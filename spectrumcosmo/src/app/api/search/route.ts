// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { searchClient, productsIndex } from '@/lib/algolia';
import { getCachedSearch, setCachedSearch } from '@/lib/search-cache';
import { getDb } from '@/lib/db';

// Cache TTL for search results
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '10');

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  // 1. Check memory cache first
  const cachedResults = getCachedSearch(q);
  if (cachedResults) {
    return NextResponse.json(cachedResults.slice(0, limit));
  }

  try {
    // 2. Try Algolia search
    const index = searchClient.initIndex(productsIndex);
    const { hits } = await index.search(q, {
      hitsPerPage: limit,
      attributesToRetrieve: ['id', 'name', 'price', 'image_url', 'currency'],
    });

    if (hits && hits.length > 0) {
      const results = hits.map((hit: any) => ({
        id: hit.id,
        name: hit.name,
        price: hit.price,
        image_url: hit.image_url,
        currency: hit.currency || 'MWK',
      }));
      
      // Cache results
      setCachedSearch(q, results);
      return NextResponse.json(results);
    }

    // 3. Fallback to PostgreSQL if Algolia has no results
    const sql = getDb();
    const fallbackResults = await sql`
      SELECT id, name, price, image_url, 'MWK' as currency
      FROM products 
      WHERE (name ILIKE ${'%' + q + '%'} OR description ILIKE ${'%' + q + '%'})
        AND status = 'in_stock'
      ORDER BY 
        CASE 
          WHEN name ILIKE ${q + '%'} THEN 1
          WHEN name ILIKE ${'%' + q + '%'} THEN 2
          ELSE 3
        END
      LIMIT ${limit}
    `;
    
    // Cache fallback results too
    if (fallbackResults.length > 0) {
      setCachedSearch(q, fallbackResults);
    }
    
    return NextResponse.json(fallbackResults);
  } catch (err) {
    console.error('Search error:', err);
    
    // Fallback to PostgreSQL on Algolia error
    try {
      const sql = getDb();
      const fallbackResults = await sql`
        SELECT id, name, price, image_url, 'MWK' as currency
        FROM products 
        WHERE (name ILIKE ${'%' + q + '%'} OR description ILIKE ${'%' + q + '%'})
          AND status = 'in_stock'
        LIMIT ${limit}
      `;
      return NextResponse.json(fallbackResults);
    } catch (dbErr) {
      console.error('Fallback search error:', dbErr);
      return NextResponse.json([]);
    }
  }
}

// Endpoint to get trending products (for empty search state)
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'trending') {
      const sql = getDb();
      const trending = await sql`
        SELECT id, name, price, image_url, 'MWK' as currency
        FROM products 
        WHERE status = 'in_stock'
        ORDER BY 
          (SELECT COUNT(*) FROM order_items WHERE product_id = products.id) DESC,
          created_at DESC
        LIMIT 8
      `;
      return NextResponse.json(trending);
    }
    
    return NextResponse.json([]);
  } catch (err) {
    console.error('Trending products error:', err);
    return NextResponse.json([]);
  }
}
