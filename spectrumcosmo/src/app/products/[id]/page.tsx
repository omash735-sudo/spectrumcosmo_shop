export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/storefront/Navbar';
import Footer from '@/components/storefront/Footer';
import StarRating from '@/components/ui/StarRating';
import CurrencyPrice from '@/components/storefront/CurrencyPrice';
import AddToCartButton from '@/components/storefront/AddToCartButton';
import ProductReviews from '@/components/storefront/ProductReviews';
import ShareButton from '@/components/storefront/ShareButton';
import { getDb } from '@/lib/db';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let product: any = null;
  let reviews: any[] = [];
  let relatedProducts: any[] = [];

  try {
    const sql = getDb();
    const [products, revs] = await Promise.all([
      sql`SELECT * FROM products WHERE id = ${id}`,
      sql`SELECT * FROM reviews WHERE product_id = ${id} AND approved = true ORDER BY created_at DESC LIMIT 5`,
    ]);
    product = products[0];
    reviews = revs;

    if (product) {
      relatedProducts = await sql`
        SELECT * FROM products
        WHERE category = ${product.category} AND id != ${id}
        ORDER BY created_at DESC LIMIT 3
      `;
    }
  } catch (err) {
    console.error(err);
  }

  if (!product) notFound();

  const avgRating =
    reviews.length > 0
      ? Math.round(reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length)
      : 0;

  const productUrl = `https://spectrumcosmo.shop/products/${product.id}`;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 mb-6 flex flex-wrap items-center gap-2">
            <Link href="/" className="hover:text-[#F97316] transition">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-[#F97316] transition">Products</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium truncate">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Left column – Image (sticky on desktop) */}
            <div className="relative lg:sticky lg:top-24 h-[400px] sm:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden bg-gray-100">
              <Image
                src={product.image_url || '/placeholder-image.jpg'}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {product.category && (
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 px-3 py-1.5 rounded-full shadow-sm">
                    {product.category}
                  </span>
                </div>
              )}
            </div>

            {/* Right column – Details */}
            <div className="flex flex-col">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>

              {/* Ratings */}
              <div className="flex items-center gap-3 mb-4">
                <StarRating rating={avgRating} />
                {reviews.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="text-3xl sm:text-4xl font-bold text-[#F97316] mb-6">
                <CurrencyPrice amountUsd={Number(product.price ?? 0)} />
              </div>

              {/* Description */}
              {product.description && (
                <div className="prose prose-sm text-gray-600 mb-6">
                  <p>{product.description}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <AddToCartButton
                  productId={String(product.id)}
                  productName={product.name}
                  imageUrl={product.image_url}
                  priceUsd={Number(product.price ?? 0)}
                />
                <Link
                  href="/checkout"
                  className="btn-secondary text-center inline-flex items-center justify-center"
                >
                  Buy Now
                </Link>
              </div>

              {/* Shipping / Payment Info */}
              <div className="bg-orange-50 rounded-xl p-5 mb-8">
                <h3 className="font-semibold text-gray-800 mb-1">🚚 Fast Delivery & Easy Payment</h3>
                <p className="text-sm text-gray-600">
                  Choose Airtel Money, TNM Mpamba, or bank transfer at checkout.
                </p>
              </div>

              {/* Social Share */}
              <div className="border-t border-gray-100 pt-6">
                <p className="text-sm text-gray-500 mb-3">Share this product:</p>
                <div className="flex gap-3">
                  <ShareButton platform="twitter" url={productUrl} title={product.name} />
                  <ShareButton platform="facebook" url={productUrl} />
                  <ShareButton platform="whatsapp" url={productUrl} text={`Check out ${product.name} on SpectrumCosmo!`} />
                  <ShareButton platform="copy" url={productUrl} />
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section with Sub-component */}
          <ProductReviews productId={id} />

          {/* You May Also Like */}
          {relatedProducts.length > 0 && (
            <div className="mt-20">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedProducts.map((rel: any) => (
                  <div key={rel.id} className="group relative bg-white border rounded-xl overflow-hidden hover:shadow-lg transition">
                    <Link href={`/products/${rel.id}`}>
                      <div className="relative h-64 bg-gray-100">
                        <Image
                          src={rel.image_url || '/placeholder-image.jpg'}
                          alt={rel.name}
                          fill
                          className="object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800">{rel.name}</h3>
                        <div className="mt-1 text-[#F97316] font-bold">
                          <CurrencyPrice amountUsd={Number(rel.price ?? 0)} />
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
