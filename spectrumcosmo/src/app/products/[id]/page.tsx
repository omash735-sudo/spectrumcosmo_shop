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
import ProductViewTracker from '@/components/storefront/ProductViewTracker';
import ContinueShopping from '@/components/storefront/ContinueShopping';
import { getDb } from '@/lib/db';

// Helper to parse JSON fields (if stored as JSONB)
function parseJsonField(field: any, defaultValue: any = []) {
  if (!field) return defaultValue;
  if (Array.isArray(field)) return field;
  try {
    return JSON.parse(field);
  } catch {
    return defaultValue;
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let product: any = null;
  let reviews: any[] = [];
  let relatedProducts: any[] = [];

  try {
    const sql = getDb();
    const [products, revs] = await Promise.all([
      sql`SELECT * FROM products WHERE id = ${id}`,
      sql`SELECT * FROM reviews WHERE product_id = ${id} AND approved = true ORDER BY created_at DESC LIMIT 20`,
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

  // Parse options from product table (assume columns: size_options, color_options, sku, tags)
  const sizeOptions = parseJsonField(product.size_options, ['30 ml', '60 ml', '80 ml', '100 ml']);
  const colorOptions = parseJsonField(product.color_options, ['Red', 'Blue', 'Green', 'Yellow']);
  const tags = parseJsonField(product.tags, []);
  const sku = product.sku || `SKU-${product.id.slice(0, 8)}`;
  const stockStatus = product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock';
  const isInStock = product.stock_quantity > 0;

  // Rating breakdown (5-star, 4-star, etc.)
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r: any) => {
    const star = Math.floor(r.rating);
    if (star >= 1 && star <= 5) ratingCounts[star as keyof typeof ratingCounts]++;
  });
  const totalReviews = reviews.length;
  const avgRating =
    totalReviews > 0
      ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / totalReviews
      : 0;

  const productUrl = `https://spectrumcosmo.shop/products/${product.id}`;

  // Prepare product object for tracking
  const productForTracking = {
    id: product.id,
    name: product.name,
    price: Number(product.price ?? 0),
    image_url: product.image_url,
  };

  return (
    <>
      <Navbar />
      <ProductViewTracker product={productForTracking} />
      <main className="min-h-screen bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Breadcrumb */}
          <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex flex-wrap items-center gap-2">
            <Link href="/" className="hover:text-[#F97316] transition">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-[#F97316] transition">Shop</Link>
            <span>/</span>
            <Link href={`/products?category=${encodeURIComponent(product.category || '')}`} className="hover:text-[#F97316] transition">
              {product.category || 'Products'}
            </Link>
            <span>/</span>
            <span className="text-gray-800 dark:text-gray-200 font-medium truncate">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Left column – Image Gallery */}
            <div className="relative lg:sticky lg:top-24">
              <div className="relative h-[400px] sm:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image
                  src={product.image_url || '/placeholder-image.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {!isInStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-4 py-2 rounded-full font-semibold text-sm">Out of Stock</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right column – Product Info */}
            <div className="flex flex-col">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {product.name}
              </h1>

              {/* Rating + Reviews count */}
              <div className="flex items-center gap-3 mb-4">
                <StarRating rating={avgRating} />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {avgRating.toFixed(1)} ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
                </span>
              </div>

              {/* Price (with discount if any) */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-[#F97316]">
                  <CurrencyPrice amountUsd={Number(product.price ?? 0)} />
                </span>
                {product.compare_price && product.compare_price > product.price && (
                  <span className="text-lg text-gray-400 line-through">
                    <CurrencyPrice amountUsd={Number(product.compare_price)} />
                  </span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="prose prose-sm dark:prose-invert text-gray-600 dark:text-gray-300 mb-6">
                  <p>{product.description}</p>
                </div>
              )}

              {/* Size / Volume Selector */}
              {sizeOptions.length > 0 && (
                <div className="mb-5">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Size/Volume</p>
                  <div className="flex flex-wrap gap-3">
                    {sizeOptions.map((size: string) => (
                      <button
                        key={size}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:border-[#F97316] hover:text-[#F97316] transition focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Selector */}
              {colorOptions.length > 0 && (
                <div className="mb-5">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</p>
                  <div className="flex flex-wrap gap-3">
                    {colorOptions.map((color: string) => (
                      <button
                        key={color}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:border-[#F97316] hover:text-[#F97316] transition focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock & Size Guide (optional) */}
              <div className="flex justify-between items-center mb-6">
                <p className={`text-sm font-medium ${isInStock ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {stockStatus}
                </p>
                {sizeOptions.length > 0 && (
                  <button className="text-sm text-[#F97316] hover:underline">View Size Guide →</button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <AddToCartButton
                  productId={String(product.id)}
                  productName={product.name}
                  imageUrl={product.image_url}
                  priceUsd={Number(product.price ?? 0)}
                  disabled={!isInStock}
                />
                <Link
                  href={isInStock ? `/checkout?product=${product.id}` : '#'}
                  className={`btn-secondary text-center inline-flex items-center justify-center ${!isInStock && 'opacity-50 cursor-not-allowed'}`}
                >
                  Buy Now
                </Link>
              </div>

              {/* SKU & Tags */}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-5 mb-5">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium">SKU:</span> {sku}
                </p>
                {tags.length > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span className="font-medium">Tags:</span> {tags.join(', ')}
                  </p>
                )}
              </div>

              {/* Share */}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Share this product:</p>
                <div className="flex gap-3">
                  <ShareButton platform="twitter" url={productUrl} title={product.name} />
                  <ShareButton platform="facebook" url={productUrl} />
                  <ShareButton platform="whatsapp" url={productUrl} text={`Check out ${product.name} on SpectrumCosmo!`} />
                  <ShareButton platform="copy" url={productUrl} />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs: Description / Reviews (with rating breakdown) */}
          <div className="mt-16 border-t border-gray-200 dark:border-gray-800 pt-10">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Left side – Rating breakdown */}
              <div className="md:col-span-1">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Rating Breakdown</h3>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = ratingCounts[star as keyof typeof ratingCounts];
                      const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-sm">
                          <span className="w-8 font-medium text-gray-600 dark:text-gray-400">{star} ★</span>
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="w-10 text-right text-gray-500 dark:text-gray-400">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {totalReviews} total reviews
                    </p>
                  </div>
                </div>
              </div>

              {/* Right side – Reviews list (using existing ProductReviews component) */}
              <div className="md:col-span-2">
                <ProductReviews productId={id} initialReviews={reviews} />
              </div>
            </div>
          </div>

          {/* You May Also Like */}
          {relatedProducts.length > 0 && (
            <div className="mt-20">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">You May Also Like</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedProducts.map((rel: any) => (
                  <div key={rel.id} className="group relative bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition">
                    <Link href={`/products/${rel.id}`}>
                      <div className="relative h-64 bg-gray-100 dark:bg-gray-700">
                        <Image
                          src={rel.image_url || '/placeholder-image.jpg'}
                          alt={rel.name}
                          fill
                          className="object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 dark:text-white">{rel.name}</h3>
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
      <ContinueShopping />
    </>
  );
}
