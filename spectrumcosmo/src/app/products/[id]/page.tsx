// app/products/[id]/page.tsx
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
import { getDb, queryOne, queryMany } from '@/lib/db';
import { 
  Heart, 
  Shield, 
  Truck, 
  RotateCcw, 
  CheckCircle,
  ChevronRight
} from 'lucide-react';

// Types
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_price: number | null;
  currency: string;
  image_url: string | null;
  category_id: string | null;
  status: string;
  stock_quantity: number;
  is_featured: boolean;
  sku: string | null;
  created_at: Date;
}

interface Variant {
  id: string;
  size: string | null;
  color: string | null;
  price_override: number | null;
  compare_price_override: number | null;
  stock_quantity: number;
  sku: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
}

// FIX: Review.id must be number to match ProductReviews component's expectation
interface Review {
  id: number;
  customer_name: string;
  rating: number;
  review_text: string;
  created_at: Date;
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let product: Product | null = null;
  let reviews: Review[] = [];
  let variants: Variant[] = [];
  let relatedProducts: Product[] = [];

  try {
    const sql = getDb();

    product = await queryOne<Product>`
      SELECT * FROM products WHERE id = ${id}
    `;

    if (product) {
      reviews = await queryMany<Review>`
        SELECT * FROM reviews WHERE product_id = ${id} AND status = 'approved' ORDER BY created_at DESC LIMIT 20
      `;
      variants = await queryMany<Variant>`
        SELECT * FROM product_variants WHERE product_id = ${id} AND is_active = true ORDER BY display_order ASC
      `;
      relatedProducts = await queryMany<Product>`
        SELECT * FROM products
        WHERE category_id = ${product.category_id} AND id != ${id} AND status = 'in_stock'
        ORDER BY created_at DESC LIMIT 4
      `;
    }
  } catch (err) {
    console.error('Product detail error:', err);
  }

  if (!product) notFound();

  // Extract unique sizes and colors from variants
  const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
  const colors = [...new Set(variants.map(v => v.color).filter(Boolean))];
  
  const hasVariants = variants.length > 0;
  const basePrice = Number(product.price ?? 0);
  const baseComparePrice = product.compare_price ? Number(product.compare_price) : null;
  
  const totalStock = hasVariants 
    ? variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
    : (product.stock_quantity || 0);
  const isInStock = totalStock > 0;

  // Rating breakdown
  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const star = Math.floor(r.rating);
    if (star >= 1 && star <= 5) ratingCounts[star as keyof typeof ratingCounts]++;
  });
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / totalReviews
    : 0;

  const productUrl = `https://spectrumcosmo.shop/products/${product.id}`;
  const productForTracking = {
    id: product.id,
    name: product.name,
    price: basePrice,
    image_url: product.image_url || '',
  };

  const trustBadges = [
    { icon: Shield, text: 'Quality Guaranteed' },
    { icon: Truck, text: 'Free Shipping Over 50,000 MWK' },
    { icon: RotateCcw, text: '30-Day Returns' },
    { icon: CheckCircle, text: 'Secure Checkout' },
  ];

  return (
    <>
      <Navbar />
      <ProductViewTracker product={productForTracking} />
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/" className="hover:text-orange-500">Home</Link>
            <ChevronRight size={14} />
            <Link href="/products" className="hover:text-orange-500">Products</Link>
            <ChevronRight size={14} />
            <span className="text-gray-600 line-clamp-1">{product.name}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Left - Image Gallery */}
            <div className="relative">
              <div className="sticky top-24">
                <div className="relative h-[400px] sm:h-[500px] lg:h-[550px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  <Image
                    src={product.image_url || '/placeholder-image.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover hover:scale-105 transition duration-700"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  {!isInStock && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold text-base">Out of Stock</span>
                    </div>
                  )}
                  {baseComparePrice && baseComparePrice > basePrice && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      SALE
                    </div>
                  )}
                  {product.is_featured && (
                    <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      Featured
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right - Product Info */}
            <div className="flex flex-col">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <StarRating rating={avgRating} />
                <span className="text-sm text-gray-500">
                  {avgRating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                </span>
                {isInStock && (
                  <span className="text-sm text-green-600 font-medium ml-2">● In Stock</span>
                )}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-orange-600" id="product-price">
                  <CurrencyPrice amountUsd={basePrice} />
                </span>
                {baseComparePrice && baseComparePrice > basePrice && (
                  <span className="text-lg text-gray-400 line-through" id="compare-price">
                    <CurrencyPrice amountUsd={baseComparePrice} />
                  </span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="prose prose-sm text-gray-600 mb-6">
                  <p>{product.description}</p>
                </div>
              )}

              {/* Size Options - from variants */}
              {sizes.length > 0 && (
                <div className="mb-5">
                  <p className="text-sm font-medium text-gray-900 mb-3">Size</p>
                  <div className="flex flex-wrap gap-2" id="size-options">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        data-size={size}
                        className="size-option px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:border-orange-500 hover:text-orange-500 transition focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Options - from variants */}
              {colors.length > 0 && (
                <div className="mb-5">
                  <p className="text-sm font-medium text-gray-900 mb-3">Color</p>
                  <div className="flex flex-wrap gap-3" id="color-options">
                    {colors.map((color) => (
                      <button
                        key={color}
                        data-color={color}
                        className="color-option px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:border-orange-500 hover:text-orange-500 transition"
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Status Message */}
              <div id="stock-status" className="mb-4">
                {isInStock ? (
                  <p className="text-sm text-green-600">✓ In Stock</p>
                ) : (
                  <p className="text-sm text-red-600">✗ Out of Stock</p>
                )}
              </div>

              {/* Quantity */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-900 mb-3">Quantity</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button id="decrement-qty" className="p-2 px-3 hover:bg-gray-50 transition">-</button>
                    <span id="product-qty" className="w-12 text-center text-sm font-medium">1</span>
                    <button id="increment-qty" className="p-2 px-3 hover:bg-gray-50 transition">+</button>
                  </div>
                  <p id="available-stock" className="text-xs text-gray-400">{totalStock} available</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <AddToCartButton
                  productId={String(product.id)}
                  productName={product.name}
                  imageUrl={product.image_url ?? undefined}
                  priceUsd={basePrice}
                  disabled={!isInStock}
                />
                <button className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:border-orange-500 hover:text-orange-500 transition">
                  <Heart size={18} />
                  Wishlist
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
                {trustBadges.map((badge, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <badge.icon size={16} className="text-orange-500" />
                    <span className="text-xs text-gray-600">{badge.text}</span>
                  </div>
                ))}
              </div>

              {/* SKU & Tags */}
              <div className="border-t border-gray-100 pt-5">
                <p className="text-sm text-gray-500" id="product-sku">
                  <span className="font-medium text-gray-700">SKU:</span> {product.sku || `SKU-${product.id.slice(0, 8)}`}
                </p>
              </div>

              {/* Share */}
              <div className="border-t border-gray-100 pt-5 mt-5">
                <p className="text-sm text-gray-600 mb-3">Share this product:</p>
                <div className="flex gap-2">
                  <ShareButton platform="twitter" url={productUrl} title={product.name} />
                  <ShareButton platform="facebook" url={productUrl} />
                  <ShareButton platform="whatsapp" url={productUrl} text={`Check out ${product.name} on SpectrumCosmo!`} />
                  <ShareButton platform="copy" url={productUrl} />
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-16 pt-8 border-t border-gray-100">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <div className="bg-gray-50 rounded-2xl p-6 sticky top-24">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Reviews</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-3xl font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                    <StarRating rating={avgRating} />
                  </div>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = ratingCounts[star as keyof typeof ratingCounts];
                      const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-sm">
                          <span className="w-8 text-gray-600">{star} ★</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="w-10 text-right text-gray-500">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-500 mt-4">{totalReviews} total reviews</p>
                </div>
              </div>
              <div className="md:col-span-2">
                {/* Reviews component now receives reviews with number id */}
                <ProductReviews productId={id} initialReviews={reviews} />
              </div>
            </div>
          </div>

          {/* You May Also Like */}
          {relatedProducts.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {relatedProducts.map((rel) => (
                  <Link key={rel.id} href={`/products/${rel.id}`} className="group">
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                      <div className="relative h-48 bg-gray-100">
                        <Image
                          src={rel.image_url || '/placeholder-image.jpg'}
                          alt={rel.name}
                          fill
                          className="object-cover group-hover:scale-105 transition duration-500"
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-gray-800 text-sm line-clamp-1 group-hover:text-orange-500 transition">
                          {rel.name}
                        </h3>
                        <div className="mt-1 text-orange-600 font-bold text-sm">
                          <CurrencyPrice amountUsd={Number(rel.price ?? 0)} />
                        </div>
                      </div>
                    </div>
                  </Link>
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
