export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Image from 'next/image'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import StarRating from '@/components/ui/StarRating'
import CurrencyPrice from '@/components/storefront/CurrencyPrice'
import AddToCartButton from '@/components/storefront/AddToCartButton'
import { getDb } from '@/lib/db'

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let product: any = null
  let reviews: any[] = []

  try {
    const sql = getDb()
    const [products, revs] = await Promise.all([
      sql`SELECT * FROM products WHERE id=${id}`,
      sql`SELECT * FROM reviews WHERE product_id=${id} AND approved=true ORDER BY created_at DESC LIMIT 5`,
    ])
    product = products[0]
    reviews = revs
  } catch (err) {
    console.error(err)
  }

  if (!product) notFound()

  const avgRating =
    reviews.length > 0
      ? Math.round(reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length)
      : 0

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {/* Breadcrumb */}
          <nav className="text-sm text-gray-400 mb-8 flex items-center gap-2">
            <a href="/" className="hover:text-[#F97316]">Home</a>
            <span>/</span>
            <a href="/products" className="hover:text-[#F97316]">Products</a>
            <span>/</span>
            <span className="text-[#111111]">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-16 mb-20">

            {/* Image */}
            <div className="relative h-[500px] rounded-3xl overflow-hidden bg-gray-50">
              <Image
                src={product.image_url || 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800'}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute top-4 left-4">
                <span className="bg-white/90 text-xs font-medium text-gray-600 px-3 py-1.5 rounded-full">
                  {product.category}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center">

              <h1 className="text-4xl font-bold text-[#111111] mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                {product.name}
              </h1>

              {reviews.length > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <StarRating rating={avgRating} />
                  <span className="text-sm text-gray-500">
                    ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                  </span>
                </div>
              )}

              <p className="text-4xl font-bold text-[#F97316] mb-6">
                <CurrencyPrice amountUsd={Number(product.price ?? 0)} />
              </p>

              {product.description && (
                <p className="text-gray-600 leading-relaxed mb-8">
                  {product.description}
                </p>
              )}

              {/* ACTIONS */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">

                <AddToCartButton
                  productId={String(product.id)}
                  productName={product.name}
                  imageUrl={product.image_url}
                  priceUsd={Number(product.price ?? 0)}
                />

                <a
                  href="/checkout"
                  className="btn-secondary text-center"
                >
                  Buy Now
                </a>

              </div>

              {/* Info Box */}
              <div className="bg-orange-50 rounded-2xl p-6">
                <h2 className="font-bold text-[#111111] mb-2">
                  Fast Delivery & Easy Payment
                </h2>
                <p className="text-sm text-gray-600">
                  Choose Airtel Money, TNM Mpamba, or Bank Transfer at checkout.
                </p>
              </div>

            </div>
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-[#111111] mb-6">
                Customer Reviews
              </h2>

              <div className="grid md:grid-cols-2 gap-4">
                {reviews.map((r: any) => (
                  <div key={r.id} className="card p-5">
                    <StarRating rating={r.rating} />
                    <p className="text-gray-700 text-sm mt-3">
                      "{r.review_text}"
                    </p>
                    <p className="text-sm font-medium text-[#111111] mt-3">
                      — {r.customer_name}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>

      <Footer />
    </>
  )
}
