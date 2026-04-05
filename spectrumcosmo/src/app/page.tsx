export const dynamic = 'force-dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles, Shield, Truck } from 'lucide-react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import ProductCard from '@/components/storefront/ProductCard'
import StarRating from '@/components/ui/StarRating'
import LiveProducts from '@/components/storefront/LiveProducts'
import LiveReviews from '@/components/storefront/LiveReviews'
import { getDb } from '@/lib/db'

// Your actual product images
const CATEGORY_IMAGES = {
  'T-Shirts': 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_16.15.36_ubl2ww.jpg',
  'Hoodies': 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-04_at_23.58.16_a0z7ns.jpg',
  'Pendants': 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_17.26.34_c2lzfq.jpg',
  'Bracelets': 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_17.26.16_rkdwvc.jpg',
}

const ABOUT_IMAGE = 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-04_at_21.52.23_bik6wg.jpg'

export default async function HomePage() {
  let products: any[] = []
  let reviews: any[] = []

  try {
    const sql = getDb()
    ;[products, reviews] = await Promise.all([
      sql`SELECT * FROM products ORDER BY created_at DESC LIMIT 6`,
      sql`SELECT * FROM reviews WHERE approved=true ORDER BY created_at DESC LIMIT 8`,
    ])
  } catch (err) {
    console.error('DB error:', err)
  }

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-white">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-50 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-50 rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-orange-50 text-[#F97316] text-sm font-medium px-4 py-1.5 rounded-full mb-6">
                <Sparkles size={14} /> New collection just dropped
              </span>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-[#111111] leading-[1.05] mb-6">
                Wear your{' '}
                <span className="text-[#F97316] relative">
                  excitement
                  <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 300 8" fill="none">
                    <path d="M2 6 C60 2, 130 7, 200 4 S270 2, 298 5" stroke="#FDBA74" strokeWidth="3" strokeLinecap="round" fill="none"/>
                  </svg>
                </span>{' '}
                with pride.
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed max-w-lg mb-10">
                Custom apparel and anime merchandise handcrafted for those who live boldly. T-shirts, hoodies, pendants, bracelets — every piece tells your story.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/products" className="btn-primary text-base px-8 py-4">Shop Now <ArrowRight size={18} /></Link>
                <Link href="#featured" className="btn-secondary text-base px-8 py-4">View Products</Link>
              </div>
              <div className="flex flex-wrap gap-6 mt-12 pt-10 border-t border-gray-100">
                {[{icon:Shield,label:'Quality Guaranteed'},{icon:Truck,label:'Fast Shipping'},{icon:Sparkles,label:'Unique Designs'}].map(({icon:Icon,label}) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-gray-500"><Icon size={16} className="text-[#F97316]" />{label}</div>
                ))}
              </div>
            </div>
            {/* Hero collage with YOUR images */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="relative h-72 rounded-2xl overflow-hidden">
                  <Image src={CATEGORY_IMAGES['T-Shirts']} alt="T-Shirt collection" fill className="object-cover" />
                </div>
                <div className="relative h-44 rounded-2xl overflow-hidden">
                  <Image src={CATEGORY_IMAGES['Bracelets']} alt="Bracelet collection" fill className="object-cover" />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="relative h-44 rounded-2xl overflow-hidden">
                  <Image src={CATEGORY_IMAGES['Pendants']} alt="Pendant collection" fill className="object-cover" />
                </div>
                <div className="relative h-72 rounded-2xl overflow-hidden">
                  <Image src={CATEGORY_IMAGES['Hoodies']} alt="Hoodie collection" fill className="object-cover" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories with YOUR images */}
        <section className="bg-[#111111] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <p className="text-[#F97316] font-medium text-sm uppercase tracking-widest mb-2">Shop by Category</p>
              <h2 className="text-3xl font-bold text-white">Find Your Style</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(CATEGORY_IMAGES).map(([label, img]) => (
                <Link key={label} href={`/products?category=${label}`}
                  className="group relative overflow-hidden rounded-2xl aspect-square border border-white/10 hover:border-[#F97316]/50 transition-all">
                  <Image src={img} alt={label} fill className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-70 group-hover:opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-bold text-lg">{label}</p>
                    <p className="text-[#FDBA74] text-xs">Shop now →</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section id="featured" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-[#F97316] font-medium text-sm mb-2 uppercase tracking-widest">Our Collection</p>
                <h2 className="text-4xl font-bold text-[#111111]">Featured Products</h2>
              </div>
              <Link href="/products" className="btn-ghost text-sm hidden sm:inline-flex">View All <ArrowRight size={16} /></Link>
            </div>
            <LiveProducts initialProducts={products} />
          </div>
        </section>

        {/* About with YOUR customer image */}
        <section className="py-24 bg-orange-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="relative">
                <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl">
                  <Image src={ABOUT_IMAGE} alt="SpectrumCosmo customer" fill className="object-cover" />
                </div>
                <div className="absolute -bottom-6 -right-6 bg-[#F97316] text-white rounded-2xl p-6 shadow-xl max-w-[200px]">
                  <p className="text-3xl font-bold">500+</p>
                  <p className="text-sm text-orange-100 mt-1">Happy customers worldwide</p>
                </div>
              </div>
              <div>
                <p className="text-[#F97316] font-medium text-sm mb-3 uppercase tracking-widest">About Us</p>
                <h2 className="text-4xl font-bold text-[#111111] mb-6 leading-tight">Where anime passion meets premium fashion</h2>
                <p className="text-gray-600 leading-relaxed mb-5">SpectrumCosmo was born from a love of anime culture and a belief that what you wear is an extension of who you are. We create merchandise that lets fans express their passion without compromise.</p>
                <p className="text-gray-600 leading-relaxed mb-8">Every piece in our collection is carefully crafted — from selecting premium materials to ensuring vibrant, long-lasting prints. Quality is our foundation.</p>
                <div className="grid grid-cols-2 gap-4">
                  {[{number:'100%',label:'Premium Materials'},{number:'48h',label:'Processing Time'},{number:'30-day',label:'Return Policy'},{number:'5★',label:'Avg. Rating'}].map(({number,label}) => (
                    <div key={label} className="bg-white rounded-xl p-4 border border-gray-100">
                      <p className="text-2xl font-bold text-[#F97316]">{number}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section id="reviews" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <p className="text-[#F97316] font-medium text-sm mb-2 uppercase tracking-widest">Testimonials</p>
              <h2 className="text-4xl font-bold text-[#111111] mb-4">What Our Customers Say</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Real reviews from real fans who wear their excitement every day.</p>
            </div>
            <LiveReviews initialReviews={reviews} />
            <div className="text-center mt-12">
              <Link href="/reviews/submit" className="btn-secondary">Write a Review <ArrowRight size={16} /></Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-br from-[#111111] to-gray-900 py-24">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Ready to wear your <span className="text-[#F97316]">excitement?</span></h2>
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">Browse our full collection and find the piece that speaks to your passion.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/products" className="btn-primary text-base px-8 py-4">Explore Products <ArrowRight size={18} /></Link>
              <Link href="/reviews/submit" className="border-2 border-white/20 text-white px-8 py-4 rounded-full font-medium hover:border-white/40 hover:bg-white/5 transition-all inline-flex items-center gap-2">Share Your Story</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
