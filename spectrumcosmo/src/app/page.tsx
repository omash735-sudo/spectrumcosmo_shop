// app/page.tsx
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Shield, Truck, Star, ShoppingBag, Zap, CheckCircle, CreditCard, Headphones, Send } from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import { getDb, queryOne, queryMany } from '@/lib/db';
import CategoriesSection from '@/components/storefront/CategoriesSection';
import FeaturedProducts from '@/components/storefront/FeaturedProducts';
import HomepagePopup from '@/components/storefront/HomepagePopup';
import RecentlyViewed from '@/components/storefront/RecentlyViewed';
import ContinueShopping from '@/components/storefront/ContinueShopping';

// Types (unchanged)
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

const fallbackHero: HeroSection = {
  id: 'fallback',
  badge_text: 'New collection just dropped',
  badge_link: '/products',
  heading_prefix: 'Wear your',
  highlighted_word: 'excitement',
  description: 'Custom apparel and anime merchandise handcrafted for those who live boldly. T-shirts, hoodies, pendants, bracelets — every piece tells your story.',
  button1_text: 'Shop Now',
  button1_link: '/products',
  feature1: 'Quality Guaranteed',
  feature2: 'Fast Shipping',
  feature3: 'Unique Designs',
  cat_image1_url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_16.15.36_ubl2ww.jpg',
  cat_image1_alt: 'T-Shirt collection',
  cat_image2_url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-04_at_23.58.16_a0z7ns.jpg',
  cat_image2_alt: 'Hoodie collection',
  cat_image3_url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_17.26.34_c2lzfq.jpg',
  cat_image3_alt: 'Pendant collection',
  cat_image4_url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_17.26.16_rkdwvc.jpg',
  cat_image4_alt: 'Bracelet collection',
};

export default async function HomePage() {
  let hero: HeroSection | null = null;
  let products: Product[] = [];
  let reviews: Review[] = [];

  try {
    const sql = getDb();
    const heroRow = await queryOne<HeroSection>`
      SELECT * FROM hero_sections WHERE page = 'home' AND active = true LIMIT 1
    `;
    hero = heroRow;
    products = await queryMany<Product>`
      SELECT * FROM products WHERE status = 'in_stock' ORDER BY created_at DESC LIMIT 8
    `;
    reviews = await queryMany<Review>`
      SELECT * FROM reviews WHERE status = 'approved' ORDER BY created_at DESC LIMIT 6
    `;
  } catch (err) {
    console.error('Homepage DB error:', err);
  }

  const h = hero || fallbackHero;

  return (
    <>
      <Navbar />
      <main>
        {/* Hero Section – Clean white background, no blobs */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Content */}
              <div className="text-center lg:text-left">
                {/* Badge – subtle gray */}
                <Link
                  href={h.badge_link || '#'}
                  className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-sm font-medium px-4 py-2 rounded-full mb-6 hover:bg-gray-200 transition"
                >
                  <Sparkles size={14} className="text-gray-500" />
                  {h.badge_text}
                  <ArrowRight size={12} />
                </Link>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.2] mb-6 tracking-tight">
                  {h.heading_prefix}{' '}
                  <span className="relative inline-block border-b-2 border-gray-900">
                    {h.highlighted_word}
                  </span>{' '}
                  with pride.
                </h1>

                <p className="text-base text-gray-500 leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8">
                  {h.description}
                </p>

                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <Link href={h.button1_link} className="btn-primary">
                    {h.button1_text}
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link href="#featured" className="btn-secondary">
                    View Collection
                    <ShoppingBag size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                <div className="flex flex-wrap gap-6 justify-center lg:justify-start mt-12 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Shield size={18} className="text-gray-500" />
                    <span className="text-sm">{h.feature1}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Truck size={18} className="text-gray-500" />
                    <span className="text-sm">{h.feature2}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Sparkles size={18} className="text-gray-500" />
                    <span className="text-sm">{h.feature3}</span>
                  </div>
                </div>
              </div>

              {/* Right Images Gallery – unchanged */}
              <div className="hidden lg:grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="relative h-72 rounded-2xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition-shadow">
                    <Image src={h.cat_image1_url} alt={h.cat_image1_alt} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition">
                      <span className="text-sm font-medium text-gray-900">Shop T-Shirts →</span>
                    </div>
                  </div>
                  <div className="relative h-44 rounded-2xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition-shadow">
                    <Image src={h.cat_image4_url} alt={h.cat_image4_alt} fill className="object-cover group-hover:scale-105 transition-transform" />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="relative h-44 rounded-2xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition-shadow">
                    <Image src={h.cat_image3_url} alt={h.cat_image3_alt} fill className="object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="relative h-72 rounded-2xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transition-shadow">
                    <Image src={h.cat_image2_url} alt={h.cat_image2_alt} fill className="object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition">
                      <span className="text-sm font-medium text-gray-900">Shop Hoodies →</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="text-center mb-10">
            <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">Shop by Category</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Explore Our Collections</h2>
            <p className="text-gray-500 mt-2 max-w-2xl mx-auto">Find the perfect piece that matches your style and passion</p>
          </div>
          <CategoriesSection />
        </div>

        {/* Featured Products */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16" id="featured">
          <div className="text-center mb-10">
            <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">Trending Now</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Featured Products</h2>
            <p className="text-gray-500 mt-2 max-w-2xl mx-auto">Handpicked items our customers love</p>
          </div>
          <FeaturedProducts />
        </div>

        {/* Reviews Section – changed background to gray-50, removed orange accents */}
        {reviews && reviews.length > 0 && (
          <div className="bg-gray-50 py-12 lg:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <span className="text-gray-500 text-sm font-medium uppercase tracking-wider">Testimonials</span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">What Our Customers Say</h2>
                <p className="text-gray-500 mt-2">Join thousands of happy customers who love their SpectrumCosmo gear</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {reviews.slice(0, 3).map((review, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className={i < (review.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">"{review.review_text || review.comment || 'Amazing quality! The design is perfect.'}"</p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-gray-700 font-semibold">
                          {(review.customer_name || review.user_name || review.name || 'A').charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">
                          {review.customer_name || review.user_name || review.name || 'Verified Buyer'}
                        </p>
                        <p className="text-xs text-gray-400">Verified Purchase</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link href="/reviews" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium">
                  Read all reviews <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Recently Viewed */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <RecentlyViewed />
        </div>

        {/* Newsletter Section – white background, gray/black button */}
        <div className="bg-white border-t border-gray-100 py-12 lg:py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full mb-6">
              <Zap size={16} className="text-gray-500" />
              <span className="text-gray-700 text-sm font-medium">Stay Updated</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Join Our Newsletter</h2>
            <p className="text-gray-500 mb-8 max-w-lg mx-auto">Get exclusive offers, early access to new drops, and anime news delivered to your inbox.</p>
            <form action="/api/newsletter/subscribe" method="POST" className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input type="email" name="email" placeholder="Your email address" className="flex-1 px-5 py-3 rounded-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition" />
              <button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-full font-semibold transition inline-flex items-center gap-2 justify-center shadow-sm">
                Subscribe <Send size={16} />
              </button>
            </form>
            <p className="text-gray-400 text-xs mt-4">No spam. Unsubscribe anytime.</p>
          </div>
        </div>

        {/* CTA Section – simplified, no orange */}
        <section className="bg-gray-50 py-12 lg:py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Ready to wear your <span className="border-b-2 border-gray-900">excitement?</span>
            </h2>
            <p className="text-gray-500 text-base mb-8 max-w-xl mx-auto">
              Browse our full collection and find the piece that speaks to your passion.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/products" className="btn-primary">
                Explore Products <ArrowRight size={18} />
              </Link>
              <Link href="/reviews/submit" className="btn-secondary">
                Share Your Story
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <HomepagePopup />
      <ContinueShopping />
    </>
  );
}
