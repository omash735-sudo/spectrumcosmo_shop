import { NextResponse } from 'next/server';
import { getDb, queryOne, queryMany } from '@/lib/db';

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
  image_url: string;
  status: string;
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
    const sql = getDb();

    const [hero, products, reviews, categories] = await Promise.all([
      queryOne<HeroSection>`
        SELECT * FROM hero_sections 
        WHERE page = 'home' AND active = true 
        LIMIT 1
      `,
      queryMany<Product>`
        SELECT * FROM products 
        WHERE status = 'in_stock' 
        ORDER BY created_at DESC 
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

    return NextResponse.json({
      hero: hero || null,
      products: products || [],
      reviews: reviews || [],
      categories: categories || [],
    });

  } catch (err) {
    console.error('Homepage data API error:', err);
    return NextResponse.json(
      {
        hero: null,
        products: [],
        reviews: [],
        categories: [],
        error: process.env.NODE_ENV !== 'production'
          ? (err instanceof Error ? err.message : 'Unknown error')
          : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
