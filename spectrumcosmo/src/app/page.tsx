// app/page.tsx
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
import HeroCarousel from '@/components/storefront/HeroCarousel';

// Types
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

// Hero carousel customization settings
// You can make these configurable via an API endpoint later
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
  let products: Product[] = [];
  let reviews: Review[] = [];

  try {
    const sql = getDb();
    products = await queryMany<Product>`
      SELECT * FROM products WHERE status = 'in_stock' ORDER BY created_at DESC LIMIT 8
    `;
    reviews = await queryMany<Review>`
      SELECT * FROM reviews WHERE status = 'approved' ORDER BY created_at DESC LIMIT 6
    `;
  } catch (err) {
    console.error('Homepage DB error:', err);
  }

  return (
    <>
      <style>{marqueeStyles}</style>
      <Navbar />
      <main>
        {/* Dynamic Hero Carousel - Replaces static hero section */}
        <HeroCarousel
          titleColor={heroSettings.titleColor}
          subtitleColor={heroSettings.subtitleColor}
          titleAlignment={heroSettings.titleAlignment}
          subtitleAlignment={heroSettings.subtitleAlignment}
          verticalPosition={heroSettings.verticalPosition}
          buttonBgColor={heroSettings.buttonBgColor}
          buttonTextColor={heroSettings.buttonTextColor}
        />

        <TrustBar />

        {/* Categories Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
          <div className="text-center mb-12">
            <span className="text-gray-600 text-sm font-medium uppercase tracking-wider">Shop by Category</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Explore Our Collections</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">Find the perfect piece that matches your style and passion</p>
          </div>
          <CategoriesSection />
        </div>

        {/* Featured Products */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16" id="featured">
          <div className="text-center mb-12">
            <span className="text-gray-600 text-sm font-medium uppercase tracking-wider">Trending Now</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">Featured Products</h2>
            <p className="text-gray-500 mt-3 max-w-2xl mx-auto">Handpicked items our customers love</p>
          </div>
          <FeaturedProducts />
        </div>

        {/* Reviews Section */}
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

        {/* Recently Viewed */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
          <RecentlyViewed />
        </div>

        {/* Newsletter Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full mb-6">
              <Zap size={16} className="text-gray-400" />
              <span className="text-gray-300 text-sm font-medium">Stay Updated</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Join Our Newsletter</h2>
            <p className="text-gray-300 mb-8 max-w-lg mx-auto">Get exclusive offers, early access to new drops, and anime news delivered to your inbox.</p>
            <form action="/api/newsletter/subscribe" method="POST" className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input 
                type="email" 
                name="email" 
                placeholder="Your email address" 
                className="flex-1 px-5 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all" 
              />
              <button 
                type="submit" 
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-full font-semibold transition-all inline-flex items-center gap-2 justify-center shadow-md hover:shadow-lg"
              >
                Subscribe <Send size={16} />
              </button>
            </form>
            <p className="text-gray-500 text-xs mt-4">No spam. Unsubscribe anytime.</p>
          </div>
        </div>

        {/* CTA Section */}
        <section className="bg-gray-50 py-20 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Ready to wear your <span className="underline decoration-2">excitement?</span>
            </h2>
            <p className="text-gray-500 text-lg mb-10 max-w-xl mx-auto">
              Browse our full collection and find the piece that speaks to your passion.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/products" 
                className="bg-gray-900 text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-800 transition-all inline-flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                Explore Products <ArrowRight size={18} />
              </Link>
              <Link 
                href="/reviews/submit" 
                className="border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-full font-semibold hover:border-gray-600 hover:text-gray-900 transition-all inline-flex items-center gap-2"
              >
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
