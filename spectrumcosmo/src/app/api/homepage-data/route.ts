// app/api/homepage-data/route.ts
import { NextResponse } from 'next/server';
import { queryOne, queryMany } from '@/lib/db';

// Same CORS policy as /api/public/products, so the installed app (which runs
// on its own origin) can call this endpoint.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

interface HeroSection {
  id: string;
  badge_text: string;
  badge_link: string;
  heading_prefix: string;
  highlighted_word: string;
  description: string;
  button1_text: string;
  button1_link: string;
  feature1: string;
  feature2: string;
  feature3: string;
  cat_image1_url: string;
  cat_image1_alt: string;
  cat_image2_url: string;
  cat_image2_alt: string;
  cat_image3_url: string;
  cat_image3_alt: string;
  cat_image4_url: string;
  cat_image4_alt: string;
  bg_image_url?: string;
  bg_image_url_dark?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price: number | null;
  image_url: string;
  status: string;
  stock_quantity: number;
  category_name: string | null;
  avg_rating: number;
  review_count: number;
  created_at: Date;
}

interface Review {
  id: string;
  customer_name: string;
  user_name?: string;
  name?: string;
  review_text: string;
  comment?: string;
  rating: number;
}

interface Category {
  id: string;
  name: string;
  image_url: string | null;
}

export async function GET() {
  try {
    const [hero, products, reviews, categories] = await Promise.all([
      queryOne<HeroSection>`
        SELECT * FROM hero_sections
        WHERE page = 'home' AND active = true
        LIMIT 1
      `,
      // Same shape the products page uses: the category NAME is joined in so
      // ProductCard can show the real category instead of "Uncategorized".
      queryMany<Product>`
        SELECT p.id, p.name, p.price, p.compare_price, p.image_url, p.status,
               p.stock_quantity, p.created_at, c.name AS category_name,
               COALESCE(r.avg_rating, 0) AS avg_rating,
               COALESCE(r.review_count, 0) AS review_count
        FROM products p
        LEFT JOIN categories c ON c.id = p.category_id
        LEFT JOIN (
        SELECT product_id,
               ROUND(AVG(rating)::numeric, 2)::float AS avg_rating,
               COUNT(*)::int AS review_count
        FROM reviews
        WHERE status = 'approved'
        GROUP BY product_id
      ) r ON r.product_id = p.id
        WHERE p.status = 'in_stock'
        ORDER BY p.created_at DESC
        LIMIT 8
      `,
      queryMany<Review>`
        SELECT * FROM reviews
        WHERE status = 'approved'
        ORDER BY created_at DESC
        LIMIT 6
      `,
      queryMany<Category>`
        SELECT id, name, image_url
        FROM categories
        WHERE is_active = true
        AND image_url IS NOT NULL
        ORDER BY sort_order ASC, name ASC
        LIMIT 4
      `,
    ]);

    return NextResponse.json(
      {
        hero: hero || null,
        products: products || [],
        reviews: reviews || [],
        categories: categories || [],
      },
      {
        // Short shared cache: repeat visitors and the app get a fast answer,
        // and admin edits show up within a minute. Errors are never cached.
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err) {
    console.error('Homepage data API error:', err);
    return NextResponse.json(
      {
        hero: null,
        products: [],
        reviews: [],
        categories: [],
        error:
          process.env.NODE_ENV !== 'production'
            ? err instanceof Error
              ? err.message
              : 'Unknown error'
            : 'Internal server error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
