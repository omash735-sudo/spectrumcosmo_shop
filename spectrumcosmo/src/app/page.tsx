import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, Shield, Truck, Star, 
  ShoppingBag, Zap, CheckCircle, 
  CreditCard, Headphones, Send, Shirt
} from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import EventAnnouncementBar from '@/components/storefront/EventAnnouncementBar';
import { getDb, queryOne, queryMany } from '@/lib/db';
import CategoriesSection from '@/components/storefront/CategoriesSection';
import HeroImageMarquee from '@/components/storefront/HeroImageMarquee';
import FeaturedProducts from '@/components/storefront/FeaturedProducts';
import HomepagePopup from '@/components/storefront/HomepagePopup';
import RecentlyViewed from '@/components/storefront/RecentlyViewed';
import ContinueShopping from '@/components/storefront/ContinueShopping';
import { Suspense } from 'react';

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

const fallbackHero: HeroSection = {
  id: 'fallback',
  badge_text: 'Get Early Access',
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

const fallbackMarqueeImages = [
  { 
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_16.15.36_ubl2ww.jpg',
    alt: 'T-Shirts',
    category: 'T-Shirts'
  },
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-04_at_23.58.16_a0z7ns.jpg',
    alt: 'Hoodies',
    category: 'Hoodies'
  },
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_17.26.34_c2lzfq.jpg',
    alt: 'Accessories',
    category: 'Accessories'
  },
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_17.26.16_rkdwvc.jpg',
    alt: 'Anime Jerseys',
    category: 'Anime Jerseys'
  }
];

function HomePageSkeleton() {
  return (
    <>
      <EventAnnouncementBar />
      <Navbar />
      <main>
        <section className="relative min-h-[60vh] md:min-h-[90vh] flex items-center bg-[var(--background)] overflow-x-hidden py-4 md:py-8 lg:py-12">
          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-start lg:items-center">
              <div className="text-center lg:text-left w-full min-w-0 overflow-x-hidden">
                <div className="h-8 bg-[var(--background-card)] rounded-lg animate-pulse w-3/4 mb-4"></div>
                <div className="h-16 bg-[var(--background-card)] rounded-lg animate-pulse w-full mb-4"></div>
                <div className="h-16 bg-[var(--background-card)] rounded-lg animate-pulse w-2/3 mb-6"></div>
                <div className="h-6 bg-[var(--background-card)] rounded-lg animate-pulse w-full max-w-lg mb-8"></div>
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-8">
                  <div className="h-12 w-40 bg-[var(--background-card)] rounded-lg animate-pulse"></div>
                  <div className="h-12 w-40 bg-[var(--background-card)] rounded-lg animate-pulse"></div>
                </div>
                <div className="flex flex-wrap gap-6 justify-center lg:justify-start pt-8 border-t border-[var(--border)]">
                  <div className="h-6 w-32 bg-[var(--background-card)] rounded-lg animate-pulse"></div>
                  <div className="h-6 w-32 bg-[var(--background-card)] rounded-lg animate-pulse"></div>
                  <div className="h-6 w-32 bg-[var(--background-card)] rounded-lg animate-pulse"></div>
                </div>
              </div>
              
              <div className="mt-8 lg:mt-0 overflow-hidden w-full max-w-full">
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-square bg-[var(--background-card)] rounded-lg animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="bg-[var(--background-secondary)] py-3 border-y border-[var(--border)]">
          <div className="flex justify-around max-w-7xl mx-auto px-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-6 w-32 bg-[var(--background-card)] rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--background-card)] py-8 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="h-4 w-40 bg-[var(--background-secondary)] rounded-lg animate-pulse mx-auto mb-2"></div>
              <div className="h-10 w-64 bg-[var(--background-secondary)] rounded-lg animate-pulse mx-auto"></div>
              <div className="h-6 w-96 bg-[var(--background-secondary)] rounded-lg animate-pulse mx-auto mt-3"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-[var(--background-secondary)] rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[var(--background-secondary)] py-8 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="h-4 w-40 bg-[var(--background-card)] rounded-lg animate-pulse mx-auto mb-2"></div>
              <div className="h-10 w-64 bg-[var(--background-card)] rounded-lg animate-pulse mx-auto"></div>
              <div className="h-6 w-96 bg-[var(--background-card)] rounded-lg animate-pulse mx-auto mt-3"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-[var(--background-card)] rounded-lg p-4 animate-pulse">
                  <div className="aspect-square bg-[var(--background-secondary)] rounded-lg mb-4"></div>
                  <div className="h-4 bg-[var(--background-secondary)] rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-[var(--background-secondary)] rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#111111] py-16 lg:py-20 border-t border-[var(--border)]">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="h-10 w-64 bg-[var(--background-card)] rounded-lg animate-pulse mx-auto mb-4"></div>
            <div className="h-6 w-96 bg-[var(--background-card)] rounded-lg animate-pulse mx-auto mb-8"></div>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="h-12 flex-1 bg-[var(--background-card)] rounded-full animate-pulse"></div>
              <div className="h-12 w-32 bg-[var(--background-card)] rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="bg-[var(--background-secondary)] py-20 lg:py-24 border-y border-[var(--border)]">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="h-12 w-96 bg-[var(--background-card)] rounded-lg animate-pulse mx-auto mb-6"></div>
            <div className="h-6 w-64 bg-[var(--background-card)] rounded-lg animate-pulse mx-auto mb-10"></div>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="h-12 w-48 bg-[var(--background-card)] rounded-lg animate-pulse"></div>
              <div className="h-12 w-48 bg-[var(--background-card)] rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
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
    <div className="bg-[var(--background-secondary)] dark:bg-[var(--background-secondary)] text-[var(--foreground)] overflow-hidden py-3 border-y border-[var(--border)]">
      <div className="relative w-full">
        <div 
          className="flex whitespace-nowrap animate-marquee hover:animation-pause"
          style={{ animation: 'marquee 25s linear infinite' }}
        >
          {doubledItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-center gap-2 mx-6 text-sm font-medium font-body">
                <Icon size={16} className="text-[var(--burnt-orange)] flex-shrink-0" />
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

async function HomePageContent() {
  let hero: HeroSection | null = null;
  let products: Product[] = [];
  let reviews: Review[] = [];
  let categories: Category[] = [];

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
    categories = await queryMany<Category>`
      SELECT id, name, image_url 
      FROM categories 
      WHERE is_active = true 
      AND image_url IS NOT NULL
      ORDER BY sort_order ASC, name ASC 
      LIMIT 4
    `;
  } catch (err) {
    console.error('Homepage DB error:', err);
  }

  const h = hero || fallbackHero;

  const marqueeImages = categories && categories.length > 0
    ? categories.map(cat => ({
        url: cat.image_url!,
        alt: cat.name,
        category: cat.name
      }))
    : fallbackMarqueeImages;

  return (
    <>
      <style>{marqueeStyles}</style>
      <EventAnnouncementBar />
      <Navbar />
      <main>
        <section className="relative min-h-[60vh] md:min-h-[90vh] flex items-center bg-[var(--background)] overflow-x-hidden manga-bg hero-manga py-4 md:py-8 lg:py-12">
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

          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-start lg:items-center">
              
              <div className="text-center lg:text-left w-full min-w-0 overflow-x-hidden">
                <h1 className="manga-title text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-[var(--foreground)] leading-[1.15] sm:leading-[1.2] mb-3 sm:mb-6 tracking-tight">
                  <span className="block sm:inline">{h.heading_prefix}</span>{' '}
                  <span className="relative inline-block">
                    <span className="text-[var(--burnt-orange)] font-black-han">
                      {h.highlighted_word}
                    </span>
                  </span>{' '}
                  <span className="whitespace-nowrap">with pride.</span>
                </h1>

                <p className="font-kanit text-sm xs:text-base sm:text-lg text-[var(--foreground-muted)] leading-relaxed max-w-lg mx-auto lg:mx-0 mb-5 sm:mb-8">
                  {h.description}
                </p>

                <div className="flex flex-wrap gap-2 sm:gap-4 justify-center lg:justify-start">
                  <Link
                    href={h.button1_link}
                    className="btn-primary font-anton tracking-wider"
                  >
                    {h.button1_text}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform sm:w-[18px] sm:h-[18px]" />
                  </Link>
                  <Link
                    href="#featured"
                    className="btn-secondary font-kanit font-bold"
                  >
                    View Collection
                    <ShoppingBag size={16} className="group-hover:translate-x-1 transition-transform sm:w-[18px] sm:h-[18px]" />
                  </Link>
                </div>

                <div className="flex flex-wrap gap-3 sm:gap-6 justify-center lg:justify-start mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-[var(--border)]">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[var(--foreground-muted)] whitespace-nowrap font-body">
                    <Shield size={15} className="text-[var(--burnt-orange)] sm:w-[18px] sm:h-[18px] flex-shrink-0" />
                    <span className="text-xs sm:text-sm">{h.feature1}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[var(--foreground-muted)] whitespace-nowrap font-body">
                    <Truck size={15} className="text-[var(--burnt-orange)] sm:w-[18px] sm:h-[18px] flex-shrink-0" />
                    <span className="text-xs sm:text-sm">{h.feature2}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[var(--foreground-muted)] whitespace-nowrap font-body">
                    <Shirt size={15} className="text-[var(--burnt-orange)] sm:w-[18px] sm:h-[18px] flex-shrink-0" />
                    <span className="text-xs sm:text-sm">{h.feature3}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 lg:mt-0 overflow-hidden w-full max-w-full">
                <div className="relative -mx-4 sm:mx-0 px-4 sm:px-0">
                  <HeroImageMarquee images={marqueeImages} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <TrustBar />

        <div className="bg-[var(--background-card)] py-8 md:py-16 manga-bg cards-manga">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-[var(--foreground-muted)] text-sm font-medium uppercase tracking-wider font-kanit">
                Shop by Category
              </span>
              <h2 className="manga-subtitle text-3xl md:text-4xl text-[var(--foreground)] mt-2">
                Explore Our Collections
              </h2>
              <p className="font-body text-[var(--foreground-muted)] mt-3 max-w-2xl mx-auto">
                Find the perfect piece that matches your style and passion
              </p>
            </div>
            <CategoriesSection />
          </div>
        </div>

        <div className="bg-[var(--background-secondary)] py-8 md:py-16" id="featured">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-[var(--foreground-muted)] text-sm font-medium uppercase tracking-wider font-kanit">
                Trending Now
              </span>
              <h2 className="manga-subtitle text-3xl md:text-4xl text-[var(--foreground)] mt-2">
                Featured Products
              </h2>
              <p className="font-body text-[var(--foreground-muted)] mt-3 max-w-2xl mx-auto">
                Handpicked items our customers love
              </p>
            </div>
            <FeaturedProducts />
          </div>
        </div>

        {reviews && reviews.length > 0 && (
          <div className="bg-[var(--background)] py-8 md:py-16 border-y border-[var(--border)] manga-bg hero-manga">
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <span className="text-[var(--foreground-muted)] text-sm font-medium uppercase tracking-wider font-kanit">
                  Testimonials
                </span>
                <h2 className="manga-subtitle text-3xl md:text-4xl text-[var(--foreground)] mt-2">
                  What Our Customers Say
                </h2>
                <p className="font-body text-[var(--foreground-muted)] mt-3">
                  Join thousands of happy customers who love their SpectrumCosmo gear
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {reviews.slice(0, 3).map((review, idx) => (
                  <div key={idx} className="bg-[var(--background-card)] rounded-2xl p-6 shadow-sm border border-[var(--border)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className={i < (review.rating || 5) ? 'fill-[var(--burnt-orange)] text-[var(--burnt-orange)]' : 'text-[var(--border)]'} />
                      ))}
                    </div>
                    <p className="font-body text-[var(--foreground-muted)] text-sm leading-relaxed">
                      "{review.review_text || review.comment || 'Amazing quality! The design is perfect.'}"
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-[var(--burnt-orange)]/10 rounded-full flex items-center justify-center">
                        <span className="text-[var(--burnt-orange)] font-anton">
                          {(review.customer_name || review.user_name || review.name || 'A').charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-heading font-semibold text-[var(--foreground)] text-sm">
                          {review.customer_name || review.user_name || review.name || 'Verified Buyer'}
                        </p>
                        <p className="font-body text-xs text-[var(--foreground-muted)]">Verified Purchase</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-8">
                <Link href="/reviews" className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] font-heading font-medium transition-colors">
                  Read all reviews <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="bg-[var(--background-card)] py-8 md:py-16 manga-bg cards-manga">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <RecentlyViewed />
          </div>
        </div>

        <div className="bg-[#111111] py-16 lg:py-20 border-t border-[var(--border)]">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="manga-display text-3xl md:text-4xl text-[#F5F5F5] mb-4">
              Join Our Newsletter
            </h2>
            <p className="font-body text-[#9A9A9A] mb-8 max-w-lg mx-auto">
              Get exclusive offers, early access to new drops, and anime news delivered to your inbox.
            </p>
            <form action="/api/newsletter/subscribe" method="POST" className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto w-full">
              <input 
                type="email" 
                name="email" 
                placeholder="Your email address" 
                className="font-body w-full sm:flex-1 px-5 py-3 rounded-full bg-[var(--background-card)] border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--burnt-orange)] focus:border-transparent transition-all" 
              />
              <button type="submit" className="btn-primary font-anton justify-center tracking-wider">
                Subscribe <Send size={16} />
              </button>
            </form>
            <p className="font-body text-[var(--foreground-muted)] text-xs mt-4">No spam. Unsubscribe anytime.</p>
          </div>
        </div>

        <section className="bg-[var(--background-secondary)] py-20 lg:py-24 border-y border-[var(--border)] manga-bg hero-manga">
          <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
            <h2 className="manga-display text-4xl sm:text-5xl text-[var(--foreground)] mb-6">
              Ready to wear your <span className="text-[var(--burnt-orange)] font-black-han">excitement?</span>
            </h2>
            <p className="font-body text-[var(--foreground-muted)] text-lg mb-10 max-w-xl mx-auto">
              Browse our full collection and find the piece that speaks to your passion.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/products" className="btn-primary font-anton tracking-wider">
                Explore Products <ArrowRight size={18} />
              </Link>
              <Link href="/reviews/submit" className="btn-secondary font-kanit font-bold">
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

export default async function HomePage() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomePageContent />
    </Suspense>
  );
}
