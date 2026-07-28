// app/products/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
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
import QuantitySelector from '@/components/storefront/QuantitySelector';
import { getDb, queryOne, queryMany } from '@/lib/db';
import { 
  Heart, 
  Shield, 
  Truck, 
  RotateCcw, 
  CheckCircle,
  ChevronLeft
} from 'lucide-react';

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

interface DbReview {
  id: number;
  customer_name: string;
  rating: number;
  review_text: string;
  created_at: Date;
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<DbReview[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data.product);
          setReviews(data.reviews || []);
          setVariants(data.variants || []);
          setRelatedProducts(data.relatedProducts || []);
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!product) {
    notFound();
  }

  const basePrice = Number(product.price ?? 0);
  const baseComparePrice = product.compare_price ? Number(product.compare_price) : null;
  const hasVariants = variants.length > 0;
  const totalStock = hasVariants 
    ? variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
    : (product.stock_quantity || 0);
  const isInStock = totalStock > 0;

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / totalReviews
    : 0;

  const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
  const colors = [...new Set(variants.map(v => v.color).filter(Boolean))];

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const star = Math.floor(r.rating);
    if (star >= 1 && star <= 5) ratingCounts[star as keyof typeof ratingCounts]++;
  });

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

  const handleIncrement = () => {
    if (quantity < totalStock) {
      setQuantity(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  return (
    <>
      <Navbar />
      <ProductViewTracker product={productForTracking} />
      <main className="min-h-screen bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-10">
          <div className="mb-4 sm:mb-6">
            <Link 
              href="/products" 
              className="inline-flex items-center gap-1.5 text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)] transition-colors"
            >
              <ChevronLeft size={16} />
              <span>Back to Products</span>
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-16">
            {/* Left - Image Gallery */}
            <div className="relative">
              <div className="sticky top-24">
                <div className="relative h-[300px] sm:h-[400px] lg:h-[550px] rounded-xl sm:rounded-2xl overflow-hidden bg-[var(--background-secondary)]">
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
                      <span className="bg-[var(--background-card)] text-[var(--foreground)] px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold text-sm sm:text-base border border-[var(--border)]">
                        Out of Stock
                      </span>
                    </div>
                  )}
                  {baseComparePrice && baseComparePrice > basePrice && (
                    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-red-500 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-bold">
                      SALE
                    </div>
                  )}
                  {product.is_featured && (
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-[var(--primary)] text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-bold">
                      Featured
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right - Product Info */}
            <div className="flex flex-col">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--foreground)] mb-2 sm:mb-3">
                {product.name}
              </h1>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <StarRating rating={avgRating} />
                <span className="text-sm text-[var(--foreground-muted)]">
                  {avgRating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                </span>
                {isInStock && (
                  <span className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium">● In Stock</span>
                )}
              </div>

              <div className="flex items-baseline gap-2 sm:gap-3 mb-4 sm:mb-6">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--primary)]">
                  <CurrencyPrice amountUsd={basePrice} />
                </span>
                {baseComparePrice && baseComparePrice > basePrice && (
                  <span className="text-base sm:text-lg text-[var(--foreground-muted)] line-through">
                    <CurrencyPrice amountUsd={baseComparePrice} />
                  </span>
                )}
              </div>

              {product.description && (
                <div className="prose prose-sm text-[var(--foreground-muted)] mb-4 sm:mb-6">
                  <p>{product.description}</p>
                </div>
              )}

              {/* Size Options */}
              {sizes.length > 0 && (
                <div className="mb-4 sm:mb-5">
                  <p className="text-sm font-medium text-[var(--foreground)] mb-2 sm:mb-3">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-3 sm:px-5 py-1.5 sm:py-2.5 border rounded-lg text-xs sm:text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${
                          selectedSize === size 
                            ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' 
                            : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color Options */}
              {colors.length > 0 && (
                <div className="mb-4 sm:mb-5">
                  <p className="text-sm font-medium text-[var(--foreground)] mb-2 sm:mb-3">Color</p>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-3 sm:px-5 py-1.5 sm:py-2.5 border rounded-lg text-xs sm:text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${
                          selectedColor === color 
                            ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' 
                            : 'border-[var(--border)] text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div id="stock-status" className="mb-3 sm:mb-4">
                {isInStock ? (
                  <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">✓ In Stock</p>
                ) : (
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">✗ Out of Stock</p>
                )}
              </div>

              {/* Quantity Selector - Interactive */}
              <QuantitySelector
                quantity={quantity}
                onIncrement={handleIncrement}
                onDecrement={handleDecrement}
                maxQuantity={totalStock}
                isInStock={isInStock}
              />

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
                <AddToCartButton
                  productId={String(product.id)}
                  productName={product.name}
                  imageUrl={product.image_url ?? undefined}
                  priceUsd={basePrice}
                  disabled={!isInStock}
                  quantity={quantity}
                  className="flex-1"
                />
                <button className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border border-[var(--border)] rounded-xl font-medium text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] transition">
                  <Heart size={18} />
                  Wishlist
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-5 sm:mb-6 p-3 sm:p-4 bg-[var(--background-secondary)] rounded-xl">
                {trustBadges.map((badge, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 sm:gap-2">
                    <badge.icon size={14} className="text-[var(--primary)] flex-shrink-0" />
                    <span className="text-xs text-[var(--foreground-muted)]">{badge.text}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[var(--border)] pt-4 sm:pt-5">
                <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
                  <span className="font-medium text-[var(--foreground)]">SKU:</span> {product.sku || `SKU-${product.id.slice(0, 8)}`}
                </p>
              </div>

              <div className="border-t border-[var(--border)] pt-4 sm:pt-5 mt-4 sm:mt-5">
                <p className="text-sm text-[var(--foreground-muted)] mb-2 sm:mb-3">Share this product:</p>
                <div className="flex flex-wrap gap-2">
                  <ShareButton platform="twitter" url={productUrl} title={product.name} />
                  <ShareButton platform="facebook" url={productUrl} />
                  <ShareButton platform="whatsapp" url={productUrl} text={`Check out ${product.name} on SpectrumCosmo!`} />
                  <ShareButton platform="copy" url={productUrl} />
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-[var(--border)]">
            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              <div className="md:col-span-1">
                <div className="bg-[var(--background-secondary)] rounded-xl sm:rounded-2xl p-4 sm:p-6 sticky top-24">
                  <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] mb-3 sm:mb-4">Customer Reviews</h3>
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <span className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">{avgRating.toFixed(1)}</span>
                    <StarRating rating={avgRating} />
                  </div>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = ratingCounts[star as keyof typeof ratingCounts];
                      const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs sm:text-sm">
                          <span className="w-7 sm:w-8 text-[var(--foreground-muted)]">{star} ★</span>
                          <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="w-8 sm:w-10 text-right text-[var(--foreground-muted)]">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-3 sm:mt-4">{totalReviews} total reviews</p>
                </div>
              </div>
              <div className="md:col-span-2">
                <ProductReviews 
                  productId={id} 
                  initialReviews={reviews.map(r => ({
                    ...r,
                    created_at: r.created_at.toISOString(),
                    customer_name: r.customer_name,
                    review_text: r.review_text,
                  }))} 
                />
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-12 sm:mt-16">
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-4 sm:mb-6">You May Also Like</h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {relatedProducts.map((rel) => (
                  <Link key={rel.id} href={`/products/${rel.id}`} className="group">
                    <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] overflow-hidden hover:shadow-lg transition-all duration-300">
                      <div className="relative h-40 sm:h-48 bg-[var(--background-secondary)]">
                        <Image
                          src={rel.image_url || '/placeholder-image.jpg'}
                          alt={rel.name}
                          fill
                          className="object-cover group-hover:scale-105 transition duration-500"
                        />
                      </div>
                      <div className="p-2 sm:p-3">
                        <h3 className="font-semibold text-[var(--foreground)] text-xs sm:text-sm line-clamp-1 group-hover:text-[var(--primary)] transition">
                          {rel.name}
                        </h3>
                        <div className="mt-1 text-[var(--primary)] font-bold text-xs sm:text-sm">
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
