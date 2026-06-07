// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import algoliasearch from 'algoliasearch';
import { getCachedSearch, setCachedSearch } from '@/lib/search-cache';
import { getDb, queryAsArray } from '@/lib/db';

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!;
const productsIndex = 'products';

interface ProductHit {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  currency: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q');
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  // Memory cache
  const cachedResults = getCachedSearch(q);
  if (cachedResults) {
    return NextResponse.json(cachedResults.slice(0, limit));
  }

  try {
    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);
    const index = client.initIndex(productsIndex);
    const { hits } = await index.search(q, {
      hitsPerPage: limit,
      attributesToRetrieve: ['id', 'name', 'price', 'image_url', 'currency'],
    });

    if (hits && hits.length > 0) {
      const results: ProductHit[] = hits.map((hit: any) => ({
        id: hit.id,
        name: hit.name,
        price: hit.price,
        image_url: hit.image_url,
        currency: hit.currency || 'MWK',
      }));
      setCachedSearch(q, results);
      return NextResponse.json(results);
    }

    // Fallback to PostgreSQL – use queryAsArray to get a real array
    const sql = getDb();
    const fallbackResults = await queryAsArray<ProductHit>`
      SELECT id, name, price, image_url, 'MWK' as currency
      FROM products 
      WHERE (name ILIKE ${'%' + q + '%'} OR description ILIKE ${'' + q + '%'})
        AND status = 'in_stock'
      LIMIT ${limit}
    `;

    if (fallbackResults.length > 0) {
      setCachedSearch(q, fallbackResults);
    }
    return NextResponse.json(fallbackResults);
  } catch (err) {
    console.error('Search error:', err);
    // Fallback to PostgreSQL on error
    try {
      const sql = getDb();
      const fallbackResults = await queryAsArray<ProductHit>`
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

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    if (action === 'trending') {
      const sql = getDb();
      const trending = await queryAsArray<ProductHit>`
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
