'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart, Eye, Star, Clock, Ban, CheckCircle } from 'lucide-react';
import CurrencyPrice from '@/components/storefront/CurrencyPrice';
import { useCart } from '@/components/storefront/CartProvider';
import { useWishlist } from '@/components/storefront/WishlistProvider';
import { useState, useEffect } from 'react';
import StarRating from '@/components/ui/StarRating';
import { saveLastCategory } from '@/lib/recentlyViewedUtils';
import toast from 'react-hot-toast';

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
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  if (!product || !product.id) {
    return null;
  }

  const priceMwk = Number(product.price ?? 0);
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist, loading: wishlistLoading } = useWishlist();
  const [localLoading, setLocalLoading] = useState(false);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);

  const isWishlisted = isInWishlist(product.id);
  const loading = wishlistLoading || localLoading;

  const isOutOfStock = product.status === 'out_of_stock' || (product.stock_quantity ?? 0) === 0;
  const isComingSoon = product.status === 'coming_soon';
  const hasDiscount = product.compare_price && product.compare_price > product.price;

  let discountPercent = 0;
  if (hasDiscount && product.compare_price) {
    discountPercent = Math.round(((product.compare_price - product.price) / product.compare_price) * 100);
  }

  const productName = product.name || 'Product';
  const productImage = product.image_url || 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600';
  const categoryName = product.category_name || product.category || 'Uncategorized';

  useEffect(() => {
    const fetchRating = async () => {
      try {
        const res = await fetch(`/api/reviews?product_id=${product.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length) {
            const sum = data.reduce((s: number, r: any) => s + r.rating, 0);
            setAvgRating(sum / data.length);
            setReviewCount(data.length);
          }
        }
      } catch (err) {
        // Silent fail
      }
    };
    fetchRating();
  }, [product.id]);

  const handleProductClick = () => {
    const categoryToSave = product.category_name || product.category;
    if (categoryToSave && categoryToSave !== 'Uncategorized') {
      saveLastCategory(categoryToSave, 1);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const userRes = await fetch('/api/auth/me');
    if (!userRes.ok) {
      toast.error('Please login to add items to wishlist');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      return;
    }
    
    setLocalLoading(true);
    try {
      await toggleWishlist(product.id);
    } catch (err) {
      console.error('Wishlist error:', err);
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
      priceUsd: priceMwk
    });
    toast.success('Added to cart');
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
    <div 
      className="group relative bg-[var(--background-card)] rounded-xl sm:rounded-2xl border border-[var(--border)] overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      onMouseEnter={() => setShowQuickView(true)}
      onMouseLeave={() => setShowQuickView(false)}
    >
      {/* Image Container */}
      <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden bg-[var(--background-secondary)]">
        <Link href={`/products/${product.id}`} onClick={handleProductClick}>
          <div className={`absolute inset-0 bg-[var(--background-secondary)] transition-opacity duration-300 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}>
            <div className="w-full h-full animate-pulse"></div>
          </div>
          <Image
            src={productImage}
            alt={productName}
            fill
            className={`object-cover group-hover:scale-110 transition-transform duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoadingComplete={() => setImageLoaded(true)}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          />
        </Link>

        {/* Sale Badge */}
        {hasDiscount && !isOutOfStock && !isComingSoon && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full z-10 shadow-md">
            -{discountPercent}%
          </div>
        )}

        {/* Status Badge */}
        {statusBadge && StatusIcon && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10">
            <span className={`${statusBadge.color} text-xs font-semibold px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-md flex items-center gap-1`}>
              <StatusIcon size={10} className="sm:w-3 sm:h-3" />
              <span className="text-[10px] sm:text-xs">{statusBadge.text}</span>
            </span>
          </div>
        )}

        {/* Quick View Overlay - Hide on mobile */}
        {showQuickView && !isOutOfStock && !isComingSoon && (
          <div className="hidden sm:flex absolute inset-0 bg-black/40 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            <button className="bg-[var(--background-card)] text-[var(--foreground)] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium hover:bg-[var(--primary)] hover:text-white transition shadow-lg flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <Eye size={14} className="sm:w-4 sm:h-4" />
              Quick View
            </button>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          disabled={loading}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[var(--background-card)]/90 backdrop-blur-sm rounded-full p-1.5 sm:p-2 shadow-md hover:bg-[var(--background-card)] hover:scale-110 transition-all duration-200 disabled:opacity-50 z-20"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={14}
            className={`sm:w-[18px] sm:h-[18px] ${isWishlisted ? 'fill-[var(--primary)] text-[var(--primary)]' : 'text-[var(--foreground-muted)]'}`}
          />
        </button>

        {/* Category Tag */}
        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-[var(--primary)]/80 backdrop-blur-sm text-white text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full z-10">
          {categoryName}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-2.5 sm:p-4">
        <Link href={`/products/${product.id}`} onClick={handleProductClick}>
          <h3 className="font-semibold text-[var(--foreground)] text-sm sm:text-base line-clamp-1 hover:text-[var(--primary)] transition">
            {productName}
          </h3>
        </Link>
        
        {/* Rating */}
        {reviewCount > 0 ? (
          <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
            <StarRating rating={avgRating} size={12} />
            <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)]">({reviewCount})</span>
          </div>
        ) : (
          <div className="flex items-center gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
            <Star size={10} className="text-[var(--border)] sm:w-3 sm:h-3" />
            <Star size={10} className="text-[var(--border)] sm:w-3 sm:h-3" />
            <Star size={10} className="text-[var(--border)] sm:w-3 sm:h-3" />
            <Star size={10} className="text-[var(--border)] sm:w-3 sm:h-3" />
            <Star size={10} className="text-[var(--border)] sm:w-3 sm:h-3" />
            <span className="text-[10px] sm:text-xs text-[var(--foreground-muted)] ml-0.5 sm:ml-1">No reviews</span>
          </div>
        )}
        
        {/* Price */}
        <div className="mt-1 sm:mt-2 flex items-baseline gap-1 sm:gap-2 flex-wrap">
          <span className="text-base sm:text-xl font-bold text-[var(--primary)]">
            <CurrencyPrice amountUsd={priceMwk} />
          </span>
          {hasDiscount && product.compare_price && (
            <span className="text-xs sm:text-sm text-[var(--foreground-muted)] line-through">
              <CurrencyPrice amountUsd={Number(product.compare_price)} />
            </span>
          )}
        </div>

        {/* Stock Warning */}
        {!isOutOfStock && !isComingSoon && (product.stock_quantity ?? 0) > 0 && (product.stock_quantity ?? 0) <= 5 && (
          <p className="text-[10px] sm:text-xs text-[var(--primary)] mt-0.5 sm:mt-1">
            Only {product.stock_quantity} left
          </p>
        )}

        {/* Action Buttons */}
        <div className="mt-2 sm:mt-4 flex gap-1.5 sm:gap-2">
          {!isOutOfStock && !isComingSoon ? (
            <>
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm flex items-center justify-center gap-1 sm:gap-2"
              >
                <ShoppingCart size={12} className="sm:w-4 sm:h-4" />
                <span>Add</span>
              </button>
              <Link
                href={`/products/${product.id}`}
                onClick={handleProductClick}
                className="px-2.5 sm:px-4 py-1.5 sm:py-2.5 border border-[var(--border)] rounded-lg sm:rounded-xl text-[var(--foreground)] hover:border-[var(--primary)]/30 hover:text-[var(--primary)] transition flex items-center justify-center"
              >
                <Eye size={12} className="sm:w-4 sm:h-4" />
              </Link>
            </>
          ) : isComingSoon ? (
            <button className="w-full bg-[var(--background-secondary)] text-[var(--foreground-muted)] py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2">
              <Clock size={12} className="sm:w-4 sm:h-4" />
              <span>Coming Soon</span>
            </button>
          ) : (
            <button className="w-full bg-[var(--background-secondary)] text-[var(--foreground-muted)] py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2">
              <Ban size={12} className="sm:w-4 sm:h-4" />
              <span>Out of Stock</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
