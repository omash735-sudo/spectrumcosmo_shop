'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart, Star, Clock, Ban } from 'lucide-react';
import CurrencyPrice from '@/components/storefront/CurrencyPrice';
import { useCart } from '@/components/storefront/CartProvider';
import { useWishlist } from '@/components/storefront/WishlistProvider';
import { useState, useEffect } from 'react';
import StarRating from '@/components/ui/StarRating';
import { saveLastCategory } from '@/lib/recentlyViewedUtils';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    compare_price?: number;
    image_url: string;
    status?: string;
    stock_quantity?: number;
    category_name?: string;
    category?: string;
    description?: string;
    avg_rating?: number;
    review_count?: number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  if (!product || !product.id) return null;
  return <ProductCardInner product={product} />;
}

function ProductCardInner({ product }: ProductCardProps) {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const router = useRouter();
  const priceMwk = Number(product.price ?? 0);
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist, loading: wishlistLoading } = useWishlist();
  const [localLoading, setLocalLoading] = useState(false);
  const hasRatingFromList = typeof product.review_count === 'number';
  const [fetchedRating, setFetchedRating] = useState({ avg: 0, count: 0 });
  const avgRating = hasRatingFromList ? Number(product.avg_rating ?? 0) : fetchedRating.avg;
  const reviewCount = hasRatingFromList ? Number(product.review_count) : fetchedRating.count;
  const [imageLoaded, setImageLoaded] = useState(false);

  const isWishlisted = isInWishlist(product.id);
  const loading = wishlistLoading || localLoading;

  const isOutOfStock = product.status === 'out_of_stock' || (product.stock_quantity ?? 0) === 0;
  const isComingSoon = product.status === 'coming_soon';
  const hasDiscount = product.compare_price && product.compare_price > product.price;

  let discountPercent = 0;
  if (hasDiscount && product.compare_price) {
    discountPercent = Math.round(
      ((product.compare_price - product.price) / product.compare_price) * 100
    );
  }

  const productName = product.name || 'Product';
  const productImage =
    product.image_url ||
    'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600';
  const categoryName = product.category_name || product.category || '';

  useEffect(() => {
    if (hasRatingFromList) return;
    let cancelled = false;
    const fetchRating = async () => {
      try {
        const res = await fetch(`\( {API_BASE}/api/reviews?product_id= \){product.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.length) {
            const sum = data.reduce((s: number, r: any) => s + r.rating, 0);
            if (!cancelled) {
              setFetchedRating({ avg: sum / data.length, count: data.length });
            }
          }
        }
      } catch {
        // silent
      }
    };
    fetchRating();
    return () => {
      cancelled = true;
    };
  }, [product.id, API_BASE, hasRatingFromList]);

  const handleProductClick = () => {
    const categoryToSave = product.category_name || product.category;
    if (categoryToSave && categoryToSave !== 'Uncategorized') {
      saveLastCategory(categoryToSave, 1);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let loggedIn = false;
    try {
      const userRes = await fetch(`${API_BASE}/api/auth/me`);
      const me = userRes.ok ? await userRes.json() : null;
      loggedIn = !!me?.user;
    } catch {
      toast.error('Could not check your login. Please try again.');
      return;
    }

    if (!loggedIn) {
      toast.error('Please login to add items to wishlist');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      return;
    }

    setLocalLoading(true);
    try {
      await toggleWishlist(product.id);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLocalLoading(false);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: String(product.id),
      name: productName,
      image_url: productImage,
      priceUsd: priceMwk,
    });
    toast.success('Added to cart');
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: String(product.id),
      name: productName,
      image_url: productImage,
      priceUsd: priceMwk,
    });
    router.push('/checkout');
  };

  const getStatusBadge = () => {
    const status = product.status || 'in_stock';
    const stock = product.stock_quantity ?? 0;

    if (status === 'out_of_stock' || stock === 0) {
      return { text: 'Out of Stock', color: 'bg-red-500 text-white', icon: Ban };
    }
    if (status === 'coming_soon') {
      return { text: 'Coming Soon', color: 'bg-yellow-500 text-white', icon: Clock };
    }
    if (status === 'pre_order') {
      return { text: 'Pre-Order', color: 'bg-blue-500 text-white', icon: Clock };
    }
    return null;
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge?.icon;

  return (
    <div className="group relative bg-[var(--background-card)] rounded-2xl border border-[var(--border)] overflow-hidden transition-all duration-300 hover:border-[var(--primary)]/40 hover:shadow-lg hover:-translate-y-1">
      {/* Image - taller fashion ratio */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[var(--background-secondary)]">
        <Link href={`/product?id=${product.id}`} onClick={handleProductClick}>
          <div
            className={`absolute inset-0 bg-[var(--background-secondary)] transition-opacity duration-300 ${
              imageLoaded ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div className="w-full h-full animate-pulse" />
          </div>
          <Image
            src={productImage}
            alt={productName}
            fill
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoadingComplete={() => setImageLoaded(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>

        {/* Discount */}
        {hasDiscount && !isOutOfStock && !isComingSoon && (
          <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[11px] font-anton font-bold px-2 py-1 rounded-full">
            -{discountPercent}%
          </div>
        )}

        {/* Status */}
        {statusBadge && StatusIcon && (
          <div className="absolute top-3 left-3 z-10">
            <span
              className={`${statusBadge.color} text-[11px] font-anton font-semibold px-2.5 py-1 rounded-full flex items-center gap-1`}
            >
              <StatusIcon size={12} />
              {statusBadge.text}
            </span>
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={handleToggleWishlist}
          disabled={loading}
          className="absolute top-3 right-3 z-20 bg-[var(--background-card)]/90 backdrop-blur-sm rounded-full p-2 hover:scale-110 transition-all disabled:opacity-50 min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={16}
            className={
              isWishlisted
                ? 'fill-[var(--primary)] text-[var(--primary)]'
                : 'text-[var(--foreground-muted)]'
            }
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <Link href={`/product?id=${product.id}`} onClick={handleProductClick}>
          <h3 className="font-kanit font-semibold text-[var(--foreground)] text-sm sm:text-[15px] line-clamp-2 leading-snug hover:text-[var(--primary)] transition-colors">
            {productName}
          </h3>
        </Link>

        {/* Rating - only show when there are reviews */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <StarRating rating={avgRating} size={12} />
            <span className="text-xs text-[var(--foreground-muted)]">({reviewCount})</span>
          </div>
        )}

        {/* Price - strongest hierarchy */}
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span className="text-lg sm:text-xl font-anton font-bold text-[var(--foreground)]">
            <CurrencyPrice amountUsd={priceMwk} />
          </span>
          {hasDiscount && product.compare_price && (
            <span className="text-sm text-[var(--foreground-muted)] line-through">
              <CurrencyPrice amountUsd={Number(product.compare_price)} />
            </span>
          )}
        </div>

        {/* Low stock */}
        {!isOutOfStock &&
          !isComingSoon &&
          (product.stock_quantity ?? 0) > 0 &&
          (product.stock_quantity ?? 0) <= 5 && (
            <p className="text-xs font-kanit text-[var(--primary)] mt-1">
              Only {product.stock_quantity} left
            </p>
          )}

        {/* Actions */}
        <div className="mt-3 sm:mt-4">
          {!isOutOfStock && !isComingSoon ? (
            <div className="flex gap-2">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-2.5 rounded-xl text-sm font-anton font-semibold transition-all flex items-center justify-center gap-2 min-h-[44px]"
              >
                <ShoppingCart size={16} />
                <span>Add to Cart</span>
              </button>
              <button
                onClick={handleBuyNow}
                className="px-3 border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white rounded-xl text-sm font-anton font-semibold transition-all min-h-[44px]"
              >
                Buy
              </button>
            </div>
          ) : isComingSoon ? (
            <button className="w-full bg-[var(--background-secondary)] text-[var(--foreground-muted)] py-2.5 rounded-xl text-sm font-kanit font-medium cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]">
              <Clock size={16} />
              Coming Soon
            </button>
          ) : (
            <button className="w-full bg-[var(--background-secondary)] text-[var(--foreground-muted)] py-2.5 rounded-xl text-sm font-kanit font-medium cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]">
              <Ban size={16} />
              Out of Stock
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
