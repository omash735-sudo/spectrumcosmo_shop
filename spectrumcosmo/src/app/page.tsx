export const dynamic = 'force-dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Shield, Truck } from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import { getDb } from '@/lib/db';
import CategoriesSection from '@/components/storefront/CategoriesSection';
import FeaturedProducts from '@/components/storefront/FeaturedProducts';
import HomepagePopup from '@/components/storefront/HomepagePopup';
import RecentlyViewed from '@/components/storefront/RecentlyViewed';
import ContinueShopping from '@/components/storefront/ContinueShopping';

export default async function HomePage() {
  let hero: any = null;
  let products: any[] = [];
  let reviews: any[] = [];

  try {
    const sql = getDb();
    [hero, products, reviews] = await Promise.all([
      sql`SELECT * FROM hero_sections WHERE page = 'home' AND active = true LIMIT 1`,
      sql`SELECT * FROM products ORDER BY created_at DESC LIMIT 6`,
      sql`SELECT * FROM reviews WHERE status = 'approved' ORDER BY created_at DESC LIMIT 8`
    ]);
    hero = hero[0];
  } catch (err) {
    console.error('DB error:', err);
  }

  // Fallback values if hero not set in DB
  const fallback = {
    badge_text: 'New collection just dropped',
    badge_link: '/newsletter',
    heading_prefix: 'Wear your',
    highlighted_word: 'excitement',
    description: 'Custom apparel and anime merchandise handcrafted for those who live boldly. T-shirts, hoodies, pendants, bracelets — every piece tells your story.',
    button1_text: 'Shop Now',
    button1_link: '/products',
    button2_text: 'View Products',
    button2_link: '#featured',
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
  const h = hero || fallback;

  return (
    <>
      <Navbar />
      <main>
        {/* Hero Section – exactly your original design, now dynamic */}
        <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-white">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-50 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-50 rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Link
                href={h.badge_link || '#'}
                className="inline-flex items-center gap-2 bg-orange-50 text-[#F97316] text-sm font-medium px-4 py-1.5 rounded-full mb-6 hover:opacity-80 hover:scale-105 active:scale-95 transition transform"
              >
                <Sparkles size={14} /> {h.badge_text}
              </Link>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-[#111111] leading-[1.05] mb-6">
                {h.heading_prefix}{' '}
                <span className="text-[#F97316] relative">
                  {h.highlighted_word}
                  <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 300 8" fill="none">
                    <path d="M2 6 C60 2, 130 7, 200 4 S270 2, 298 5" stroke="#FDBA74" strokeWidth="3" strokeLinecap="round" fill="none"/>
                  </svg>
                </span>{' '}
                with pride.
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed max-w-lg mb-10">
                {h.description}
              </p>
              <div className="flex flex-wrap gap-4">
                {/* ONLY SHOP NOW BUTTON - View Products removed */}
                <Link href={h.button1_link} className="btn-primary text-base px-8 py-4">
                  {h.button1_text} <ArrowRight size={18} />
                </Link>
              </div>
              <div className="flex flex-wrap gap-6 mt-12 pt-10 border-t border-gray-100">
                {[
                  { icon: Shield, label: h.feature1 },
                  { icon: Truck, label: h.feature2 },
                  { icon: Sparkles, label: h.feature3 }
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-gray-500">
                    <Icon size={16} className="text-[#F97316]" />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="relative h-72 rounded-2xl overflow-hidden">
                  <Image src={h.cat_image1_url} alt={h.cat_image1_alt} fill className="object-cover" />
                </div>
                <div className="relative h-44 rounded-2xl overflow-hidden">
                  <Image src={h.cat_image4_url} alt={h.cat_image4_alt} fill className="object-cover" />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="relative h-44 rounded-2xl overflow-hidden">
                  <Image src={h.cat_image3_url} alt={h.cat_image3_alt} fill className="object-cover" />
                </div>
                <div className="relative h-72 rounded-2xl overflow-hidden">
                  <Image src={h.cat_image2_url} alt={h.cat_image2_alt} fill className="object-cover" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories & Featured Products & Recently Viewed sections */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CategoriesSection />
          <FeaturedProducts />
          <RecentlyViewed />
        </div>

        {/* Original CTA section */}
        <section className="bg-gradient-to-br from-[#111111] to-gray-900 py-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Ready to wear your <span className="text-[#F97316]">excitement?</span>
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
              Browse our full collection and find the piece that speaks to your passion.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/products" className="bg-[#F97316] text-white px-8 py-4 rounded-full font-medium hover:bg-[#e0650f] transition inline-flex items-center gap-2">
                Explore Products <ArrowRight size={18} />
              </Link>
              <Link href="/reviews/submit" className="border-2 border-white/20 text-white px-8 py-4 rounded-full font-medium hover:border-white/40 hover:bg-white/5 transition-all inline-flex items-center gap-2">
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
