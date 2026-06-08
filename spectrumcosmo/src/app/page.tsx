export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, Sparkles, Shield, Truck, Star, 
  ShoppingBag, Zap, CheckCircle, 
  CreditCard, Headphones, Send
} from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import { getDb, queryOne, queryMany } from '@/lib/db';
import CategoriesSection from '@/components/storefront/CategoriesSection';
import FeaturedProducts from '@/components/storefront/FeaturedProducts';
import HomepagePopup from '@/components/storefront/HomepagePopup';
import RecentlyViewed from '@/components/storefront/RecentlyViewed';
import ContinueShopping from '@/components/storefront/ContinueShopping';
import HeroCarousel from '@/components/storefront/HeroCarousel'; // ADD THIS

// Types (keep all your existing types)
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

function TrustBar() {
  const trustItems = [
    { icon: CheckCircle, text: '100% Authentic Products' },
    { icon: Truck, text: 'Free Shipping Over 50,000 MWK' },
    { icon: CreditCard, text: 'Secure Payments' },
    { icon: Headphones, text: '24/7 Customer Support' },
    { icon: Shield, text: 'Buyer Protection' },
    { icon: Zap, text: 'Fast Delivery' },
  ];
  const doubledItems = [...trustItems, ...trustItems];
  return (
    <div className="bg-gray-900 text-white overflow-hidden py-3">
      <div className="relative w-full">
        <div 
          className="flex whitespace-nowrap animate-marquee hover:animation-pause"
          style={{ animation: 'marquee 25s linear infinite' }}
        >
          {doubledItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-center gap-2 mx-6 text-sm font-medium">
                <Icon size={16} className="text-orange-400 flex-shrink-0" />
                <span>{item.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const marqueeStyles = `
  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  .animate-marquee {
    animation: marquee 25s linear infinite;
    will-change: transform;
  }
  .hover\\:animation-pause:hover {
    animation-play-state: paused;
  }
`;

// Hero carousel settings for mobile replacement only
const heroSettings = {
  titleColor: '#FFFFFF',
  subtitleColor: '#FFFFFF',
  titleAlignment: 'center' as const,
  subtitleAlignment: 'center' as const,
  verticalPosition: 'bottom' as const,
  buttonBgColor: '#F97316',
  buttonTextColor: '#FFFFFF',
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
      <style>{marqueeStyles}</style>
      <Navbar />
      <main>
        {/* Hero Section - KEPT INTACT */}
        <section className="relative min-h-[60vh] md:min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-white via-orange-50/10 to-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-300/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Content - KEPT INTACT */}
              <div className="text-center lg:text-left">
                <Link
                  href={h.badge_link || '#'}
                  className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 text-sm font-medium px-4 py-2 rounded-full mb-6 hover:bg-gray-200 transition"
                >
                  <Sparkles size={14} className="text-orange-500" />
                  {h.badge_text}
                  <ArrowRight size={12} />
                </Link>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] mb-6 tracking-tight">
                  {h.heading_prefix}{' '}
                  <span className="relative inline-block">
                    <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                      {h.highlighted_word}
                    </span>
                    <svg className="absolute -bottom-3 left-0 w-full" height="10" viewBox="0 0 300 10" fill="none">
                      <path d="M2 7 C60 3, 130 8, 200 5 S270 3, 298 6" stroke="#F97316" strokeWidth="3" strokeLinecap="round" fill="none"/>
                    </svg>
                  </span>{' '}
                  with pride.
                </h1>

                <p className="text-lg text-gray-600 leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8">
                  {h.description}
                </p>

                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <Link
                    href={h.button1_link}
                    className="group bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 shadow-md hover:shadow-lg inline-flex items-center gap-2"
                  >
                    {h.button1_text}
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="#featured"
                    className="group border-2 border-gray-300 hover:border-gray-600 text-gray-700 hover:text-gray-900 px-8 py-4 rounded-full font-semibold transition-all duration-300 inline-flex items-center gap-2"
                  >
                    View Collection
                    <ShoppingBag size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                <div className="flex flex-wrap gap-6 justify-center lg:justify-start mt-12 pt-8 border-t border-gray-100">
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

              {/* Right Images Gallery (desktop only) - KEPT INTACT */}
              <div className="hidden lg:grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="relative h-72 rounded-2xl overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-shadow duration-300">
                    <Image src={h.cat_image1_url} alt={h.cat_image1_alt} fill className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-sm font-medium text-gray-800">Shop T-Shirts →</span>
                    </div>
                  </div>
                  <div className="relative h-44 rounded-2xl overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-shadow duration-300">
                    <Image src={h.cat_image4_url} alt={h.cat_image4_alt} fill className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="relative h-44 rounded-2xl overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-shadow duration-300">
                    <Image src={h.cat_image3_url} alt={h.cat_image3_alt} fill className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                  </div>
                  <div className="relative h-72 rounded-2xl overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-shadow duration-300">
                    <Image src={h.cat_image2_url} alt={h.cat_image2_alt} fill className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                    <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-sm font-medium text-gray-800">Shop Hoodies →</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* REPLACED: Mobile static image with HeroCarousel */}
            <div className="lg:hidden mt-8">
              <HeroCarousel
                titleColor={heroSettings.titleColor}
                subtitleColor={heroSettings.subtitleColor}
                titleAlignment={heroSettings.titleAlignment}
                subtitleAlignment={heroSettings.subtitleAlignment}
                verticalPosition={heroSettings.verticalPosition}
                buttonBgColor={heroSettings.buttonBgColor}
                buttonTextColor={heroSettings.buttonTextColor}
              />
            </div>
          </div>
        </section>

        <TrustBar />

        {/* Rest of your page - KEPT INTACT */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
          <div className="text-center mb-12">
            <span className="text-gray-600 text-sm font-medium uppercase tracking-wider">Shop by Category</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Explore Our Collections</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">Find the perfect piece that matches your style and passion</p>
          </div>
          <CategoriesSection />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16" id="featured">
          <div className="text-center mb-12">
            <span className="text-gray-600 text-sm font-medium uppercase tracking-wider">Trending Now</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Featured Products</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">Handpicked items our customers love</p>
          </div>
          <FeaturedProducts />
        </div>

        {reviews && reviews.length > 0 && (
          <div className="bg-gradient-to-br from-orange-50 to-white py-8 md:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <span className="text-gray-600 text-sm font-medium uppercase tracking-wider">Testimonials</span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">What Our Customers Say</h2>
                <p className="text-gray-500 mt-3">Join thousands of happy customers who love their SpectrumCosmo gear</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {reviews.slice(0, 3).map((review, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className={i < (review.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">"{review.review_text || review.comment || 'Amazing quality! The design is perfect.'}"</p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 font-semibold">
                          {(review.customer_name || review.user_name || review.name || 'A').charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">
                          {review.customer_name || review.user_name || review.name || 'Verified Buyer'}
                        </p>
                        <p className="text-xs text-gray-400">Verified Purchase</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link href="/reviews" className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium transition-colors">
                  Read all reviews <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
          <RecentlyViewed />
        </div>

        <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full mb-6">
              <Zap size={16} className="text-gray-400" />
              <span className="text-gray-300 text-sm font-medium">Stay Updated</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Join Our Newsletter</h2>
            <p className="text-gray-300 mb-8 max-w-lg mx-auto">Get exclusive offers, early access to new drops, and anime news delivered to your inbox.</p>
            <form action="/api/newsletter/subscribe" method="POST" className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input type="email" name="email" placeholder="Your email address" className="flex-1 px-5 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all" />
              <button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-full font-semibold transition-all inline-flex items-center gap-2 justify-center shadow-md hover:shadow-lg">
                Subscribe <Send size={16} />
              </button>
            </form>
            <p className="text-gray-500 text-xs mt-4">No spam. Unsubscribe anytime.</p>
          </div>
        </div>

        <section className="bg-gray-50 py-20 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Ready to wear your <span className="underline decoration-2">excitement?</span>
            </h2>
            <p className="text-gray-500 text-lg mb-10 max-w-xl mx-auto">
              Browse our full collection and find the piece that speaks to your passion.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/products" className="bg-gray-900 text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-800 transition-all inline-flex items-center gap-2 shadow-lg hover:shadow-xl">
                Explore Products <ArrowRight size={18} />
              </Link>
              <Link href="/reviews/submit" className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full font-semibold hover:border-gray-600 hover:text-gray-900 transition-all inline-flex items-center gap-2">
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

