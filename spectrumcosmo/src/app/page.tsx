export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, Sparkles, Shield, Truck, Star, 
  ShoppingBag, Zap, CheckCircle, 
  CreditCard, Headphones, Send
} from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import EventAnnouncementBar from '@/components/storefront/EventAnnouncementBar';
import Footer from '@/components/storefront/Footer';
import { getDb, queryOne, queryMany } from '@/lib/db';
import CategoriesSection from '@/components/storefront/CategoriesSection';
import HeroImageMarquee from '@/components/storefront/HeroImageMarquee';
import FeaturedProducts from '@/components/storefront/FeaturedProducts';
import HomepagePopup from '@/components/storefront/HomepagePopup';
import RecentlyViewed from '@/components/storefront/RecentlyViewed';
import ContinueShopping from '@/components/storefront/ContinueShopping';

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
  bg_image_url: '',
  bg_image_url_dark: '',
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
    <div className="bg-gray-900 dark:bg-gray-950 text-white overflow-hidden py-3">
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
      <EventAnnouncementBar />
      <Navbar />
      <main>
        {/* ============================================
            HERO SECTION - FIXED FOR MOBILE
            ============================================ */}
        <section className="relative min-h-[60vh] md:min-h-[90vh] flex items-center overflow-hidden bg-white dark:bg-gray-900">
          {h.bg_image_url && (
            <Image
              src={h.bg_image_url}
              alt=""
              fill
              priority
              className="object-cover dark:hidden"
            />
          )}
          {h.bg_image_url_dark && (
            <Image
              src={h.bg_image_url_dark}
              alt=""
              fill
              priority
              className="object-cover hidden dark:block"
            />
          )}

          <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
              {/* LEFT CONTENT - MOBILE OPTIMIZED */}
              <div className="text-center lg:text-left w-full max-w-full overflow-hidden">
                
                {/* Badge - FIXED: Added truncate and max-width */}
                <Link
                  href={h.badge_link || '#'}
                  className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-4 sm:mb-6 hover:bg-gray-200 dark:hover:bg-gray-700 transition max-w-full"
                >
                  <Sparkles size={12} className="text-orange-500 flex-shrink-0 sm:w-[14px] sm:h-[14px]" />
                  <span className="truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">{h.badge_text}</span>
                  <ArrowRight size={12} className="flex-shrink-0" />
                </Link>

                {/* Heading - FIXED: Smaller on mobile, proper word break */}
                <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 dark:text-white leading-[1.15] sm:leading-[1.2] mb-3 sm:mb-6 tracking-tight break-words">
                  <span className="block sm:inline">{h.heading_prefix}</span>{' '}
                  <span className="relative inline-block">
                    <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent break-words">
                      {h.highlighted_word}
                    </span>
                    <svg className="absolute -bottom-2 sm:-bottom-3 left-0 w-full" height="8" viewBox="0 0 300 10" fill="none">
                      <path d="M2 7 C60 3, 130 8, 200 5 S270 3, 298 6" stroke="#F97316" strokeWidth="3" strokeLinecap="round" fill="none"/>
                    </svg>
                  </span>{' '}
                  <span className="whitespace-nowrap">with pride.</span>
                </h1>

                {/* Description - FIXED: Better mobile text size */}
                <p className="text-sm xs:text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg mx-auto lg:mx-0 mb-5 sm:mb-8 break-words">
                  {h.description}
                </p>

                {/* Buttons - FIXED: Better mobile spacing */}
                <div className="flex flex-wrap gap-2 sm:gap-4 justify-center lg:justify-start">
                  <Link
                    href={h.button1_link}
                    className="group bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700 text-white px-5 sm:px-8 py-2.5 sm:py-4 rounded-full font-semibold transition-all duration-300 shadow-md hover:shadow-lg inline-flex items-center gap-2 text-sm sm:text-base"
                  >
                    {h.button1_text}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform sm:w-[18px] sm:h-[18px]" />
                  </Link>
                  <Link
                    href="#featured"
                    className="group border-2 border-gray-300 dark:border-gray-600 hover:border-gray-600 dark:hover:border-gray-400 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-5 sm:px-8 py-2.5 sm:py-4 rounded-full font-semibold transition-all duration-300 inline-flex items-center gap-2 text-sm sm:text-base"
                  >
                    View Collection
                    <ShoppingBag size={16} className="group-hover:translate-x-1 transition-transform sm:w-[18px] sm:h-[18px]" />
                  </Link>
                </div>

                {/* Features - FIXED: Better mobile spacing */}
                <div className="flex flex-wrap gap-4 sm:gap-6 justify-center lg:justify-start mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-400">
                    <Shield size={15} className="text-gray-500 dark:text-gray-500 sm:w-[18px] sm:h-[18px]" />
                    <span className="text-xs sm:text-sm">{h.feature1}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-400">
                    <Truck size={15} className="text-gray-500 dark:text-gray-500 sm:w-[18px] sm:h-[18px]" />
                    <span className="text-xs sm:text-sm">{h.feature2}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-400">
                    <Sparkles size={15} className="text-gray-500 dark:text-gray-500 sm:w-[18px] sm:h-[18px]" />
                    <span className="text-xs sm:text-sm">{h.feature3}</span>
                  </div>
                </div>
              </div>

              {/* RIGHT IMAGES - MARQUEE */}
              <div className="mt-8 lg:mt-0">
                <HeroImageMarquee
                  images={[
                    { url: h.cat_image1_url, alt: h.cat_image1_alt },
                    { url: h.cat_image2_url, alt: h.cat_image2_alt },
                    { url: h.cat_image3_url, alt: h.cat_image3_alt },
                    { url: h.cat_image4_url, alt: h.cat_image4_alt },
                  ]}
                />
              </div>
            </div>
          </div>
        </section>

        <TrustBar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
          <div className="text-center mb-12">
            <span className="text-gray-600 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Shop by Category</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">Explore Our Collections</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-2xl mx-auto">Find the perfect piece that matches your style and passion</p>
          </div>
          <CategoriesSection />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16" id="featured">
          <div className="text-center mb-12">
            <span className="text-gray-600 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Trending Now</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">Featured Products</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-3 max-w-2xl mx-auto">Handpicked items our customers love</p>
          </div>
          <FeaturedProducts />
        </div>

        {reviews && reviews.length > 0 && (
          <div className="bg-orange-50 dark:bg-gray-800 py-8 md:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <span className="text-gray-600 dark:text-gray-400 text-sm font-medium uppercase tracking-wider">Testimonials</span>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mt-2">What Our Customers Say</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-3">Join thousands of happy customers who love their SpectrumCosmo gear</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {reviews.slice(0, 3).map((review, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className={i < (review.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'} />
                      ))}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">"{review.review_text || review.comment || 'Amazing quality! The design is perfect.'}"</p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 dark:text-orange-400 font-semibold">
                          {(review.customer_name || review.user_name || review.name || 'A').charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                          {review.customer_name || review.user_name || review.name || 'Verified Buyer'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Verified Purchase</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link href="/reviews" className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors">
                  Read all reviews <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
          <RecentlyViewed />
        </div>

        <div className="bg-gray-900 dark:bg-gray-950 py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-gray-800 dark:bg-gray-800 px-4 py-2 rounded-full mb-6">
              <Zap size={16} className="text-gray-400" />
              <span className="text-gray-300 text-sm font-medium">Stay Updated</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Join Our Newsletter</h2>
            <p className="text-gray-300 mb-8 max-w-lg mx-auto">Get exclusive offers, early access to new drops, and anime news delivered to your inbox.</p>
            <form action="/api/newsletter/subscribe" method="POST" className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input type="email" name="email" placeholder="Your email address" className="flex-1 px-5 py-3 rounded-full bg-white/10 dark:bg-gray-800/50 border border-white/20 dark:border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all" />
              <button type="submit" className="bg-gray-800 dark:bg-gray-800 hover:bg-gray-700 dark:hover:bg-gray-700 text-white px-6 py-3 rounded-full font-semibold transition-all inline-flex items-center gap-2 justify-center shadow-md hover:shadow-lg">
                Subscribe <Send size={16} />
              </button>
            </form>
            <p className="text-gray-500 text-xs mt-4">No spam. Unsubscribe anytime.</p>
          </div>
        </div>

        <section className="bg-gray-50 dark:bg-gray-900 py-20 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Ready to wear your <span className="underline decoration-2">excitement?</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-10 max-w-xl mx-auto">
              Browse our full collection and find the piece that speaks to your passion.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/products" className="bg-gray-900 dark:bg-gray-800 text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-800 dark:hover:bg-gray-700 transition-all inline-flex items-center gap-2 shadow-lg hover:shadow-xl">
                Explore Products <ArrowRight size={18} />
              </Link>
              <Link href="/reviews/submit" className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-full font-semibold hover:border-gray-600 dark:hover:border-gray-400 hover:text-gray-900 dark:hover:text-white transition-all inline-flex items-center gap-2">
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
