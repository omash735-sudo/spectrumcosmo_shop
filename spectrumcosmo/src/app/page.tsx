export const dynamic = 'force-dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles, Shield, Truck } from 'lucide-react';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import HeroCarousel from '@/components/storefront/HeroCarousel';
import { getDb } from '@/lib/db';

const CATEGORY_IMAGES = {
  'T-Shirts': 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_16.15.36_ubl2ww.jpg',
  'Hoodies': 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-04_at_23.58.16_a0z7ns.jpg',
  'Pendants': 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_17.26.34_c2lzfq.jpg',
  'Bracelets': 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_17.26.16_rkdwvc.jpg',
};

export default async function HomePage() {
  let products: any[] = [];
  let reviews: any[] = [];
  let hero: any = null;

  try {
    const sql = getDb();
    [products, reviews, hero] = await Promise.all([
      sql`SELECT * FROM products ORDER BY created_at DESC LIMIT 6`,
      sql`SELECT * FROM reviews WHERE status = 'approved' ORDER BY created_at DESC LIMIT 8`,
      sql`SELECT * FROM hero_sections WHERE page = 'home' AND active = true LIMIT 1`
    ]);
    hero = hero[0];
  } catch (err) {
    console.error('DB error:', err);
  }

  return (
    <>
      <Navbar />
      <main>
        {/* Dynamic Hero Section */}
        {hero && hero.active && (
          hero.type === 'carousel' && hero.images.length > 1 ? (
            <HeroCarousel
              slides={hero.images.map((img: string, idx: number) => ({
                id: idx,
                image: img,
                title: hero.title || '',
                subtitle: hero.subtitle || '',
              }))}
              textColor={hero.text_color}
              autoplayDelay={5000}
            />
          ) : (
            hero.images[0] && (
              <div className="relative h-[500px] md:h-[600px] w-full overflow-hidden">
                <Image
                  src={hero.images[0]}
                  alt={hero.title || 'Hero'}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-black" style={{ opacity: hero.overlay_opacity / 100 }} />
                <div className={`absolute inset-0 flex flex-col items-${hero.button_placement || 'center'} justify-${hero.vertical_position || 'bottom'} text-center px-4`}>
                  <h2 className={`${hero.text_size || 'text-5xl'} font-bold drop-shadow-lg`} style={{ color: hero.text_color || '#FFFFFF' }}>
                    {hero.title}
                  </h2>
                  {hero.subtitle && <p className="text-white text-lg md:text-xl mt-2">{hero.subtitle}</p>}
                  {hero.button_label && (
                    <Link href={hero.button_link || '#'} className="mt-6 bg-orange-500 text-white px-6 py-3 rounded-full hover:bg-orange-600 transition inline-flex items-center gap-2">
                      {hero.button_label} <ArrowRight size={18} />
                    </Link>
                  )}
                </div>
              </div>
            )
          )
        )}

        {/* Secondary Section – Optional: You can keep the two‑column layout below if you wish */}
        <div className="max-w-7xl mx-auto px-4 py-16">
          {/* Add back your other sections (featured products, categories, CTA) if needed */}
        </div>

        {/* Final CTA Section (unchanged) */}
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
    </>
  );
}
