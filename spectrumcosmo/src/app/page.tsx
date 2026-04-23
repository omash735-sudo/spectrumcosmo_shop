export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles, Shield, Truck } from 'lucide-react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import ProductCard from '@/components/storefront/ProductCard'
import StarRating from '@/components/ui/StarRating'
import { getDb } from '@/lib/db'

const CATEGORY_IMAGES = {
  'T-Shirts': 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_16.15.36_ubl2ww.jpg',
  'Hoodies': 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-04_at_23.58.16_a0z7ns.jpg',
  'Pendants': 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_17.26.34_c2lzfq.jpg',
  'Bracelets': 'https://res.cloudinary.com/dfsvnaslv/image/upload/WhatsApp_Image_2026-04-03_at_17.26.16_rkdwvc.jpg',
}

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

      <main className="pt-16">

        {/* HERO */}
        <section className="relative min-h-[85vh] sm:min-h-[95vh] flex items-center overflow-hidden bg-white">

          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-50 rounded-full blur-3xl opacity-60 -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-50 rounded-full blur-3xl opacity-60 translate-y-1/3 -translate-x-1/4" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">

            <div>

              <Link
                href="/newsletter"
                className="inline-flex items-center gap-2 bg-orange-50 text-[#F97316] text-sm font-medium px-5 py-2 rounded-full mb-8"
              >
                <Sparkles size={14} /> New collection just dropped
              </Link>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-[#111111] leading-[1.05] mb-6">
                Wear your <span className="text-[#F97316]">excitement</span> with pride.
              </h1>

              <p className="text-lg text-gray-500 leading-relaxed max-w-lg mb-10">
                Custom apparel and anime merchandise made for bold individuals.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/products" className="w-full sm:w-auto bg-[#F97316] text-white px-8 py-4 rounded-full font-medium flex items-center justify-center gap-2">
                  Shop Now <ArrowRight size={18} />
                </Link>

                <Link href="#featured" className="w-full sm:w-auto border border-gray-200 px-8 py-4 rounded-full font-medium text-center">
                  View Products
                </Link>
              </div>

              <div className="flex flex-wrap gap-6 mt-12 pt-8 border-t border-gray-100">
                {[{icon:Shield,label:'Quality Guaranteed'},{icon:Truck,label:'Fast Shipping'},{icon:Sparkles,label:'Unique Designs'}].map(({icon:Icon,label}) => (
                  <div key={label} className="flex items-center gap-2 text-sm text-gray-500">
                    <Icon size={16} className="text-[#F97316]" />
                    {label}
                  </div>
                ))}
              </div>

            </div>

            {/* IMAGES */}
            <div className="hidden lg:grid grid-cols-2 gap-5">
              {Object.keys(CATEGORY_IMAGES).map((key, i) => (
                <div key={key} className="relative h-60 rounded-3xl overflow-hidden">
                  <Image src={CATEGORY_IMAGES[key]} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* CATEGORIES */}
        <section className="py-20 bg-[#fafafa]">
          <div className="max-w-7xl mx-auto px-4">

            <h2 className="text-3xl font-bold mb-10">Explore Categories</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              {Object.entries(CATEGORY_IMAGES).map(([name, img]) => (
                <Link key={name} href={`/products?category=${name}`} className="group relative h-64 rounded-3xl overflow-hidden">

                  <Image src={img} alt={name} fill className="object-cover group-hover:scale-110 transition" />

                  <div className="absolute inset-0 bg-black/30" />

                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="font-semibold">{name}</h3>
                  </div>

                </Link>
              ))}

            </div>
          </div>
        </section>

        {/* PRODUCTS */}
        <section id="featured" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4">

            <div className="flex justify-between mb-10">
              <h2 className="text-3xl font-bold">Featured Products</h2>
              <Link href="/products">View all</Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

          </div>
        </section>

        {/* REVIEWS */}
        <section className="py-24 bg-[#fafafa]">
          <div className="max-w-7xl mx-auto px-4">

            <h2 className="text-3xl font-bold mb-10">What People Are Saying</h2>

            <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide">

              {reviews.map((review) => (
                <div key={review.id} className="min-w-[85%] sm:min-w-[350px] snap-start bg-white rounded-3xl p-6 border">

                  <div className="flex justify-between mb-3">
                    <span className="font-semibold">{review.name || 'Anonymous'}</span>
                    <StarRating rating={review.rating || 5} />
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{review.comment}</p>

                  <span className="text-xs text-gray-400">Verified customer</span>

                </div>
              ))}

            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#111111] py-20 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">
            Ready to wear your <span className="text-[#F97316]">excitement?</span>
          </h2>

          <Link href="/products" className="bg-[#F97316] px-8 py-4 rounded-full">
            Explore Products
          </Link>
        </section>

      </main>

      <Footer />
    </>
  )
                    }
