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
  // Early return if product is invalid
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

  // Safe discount percent calculation
  let discountPercent = 0;
  if (hasDiscount && product.compare_price) {
    discountPercent = Math.round(((product.compare_price - product.price) / product.compare_price) * 100);
  }

  const productName = product.name || 'Product';
  const productImage = product.image_url || 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600';
  const categoryName = product.category_name || product.category || 'Uncategorized';

  // Fetch rating
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
    
    // Check login first
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
      className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
      onMouseEnter={() => setShowQuickView(true)}
      onMouseLeave={() => setShowQuickView(false)}
    >
      {/* Image Container */}
      <div className="relative h-56 sm:h-64 md:h-72 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        <Link href={`/products/${product.id}`} onClick={handleProductClick}>
          {/* Loading skeleton */}
          <div className={`absolute inset-0 bg-gray-100 transition-opacity duration-300 ${imageLoaded ? 'opacity-0' : 'opacity-100'}`}>
            <div className="w-full h-full animate-pulse"></div>
          </div>
          <Image
            src={productImage}
            alt={productName}
            fill
            className={`object-cover group-hover:scale-110 transition-transform duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoadingComplete={() => setImageLoaded(true)}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          />
        </Link>

        {/* Sale Badge */}
        {hasDiscount && !isOutOfStock && !isComingSoon && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow-md">
            -{discountPercent}%
          </div>
        )}

        {/* Status Badge (Out of Stock / Coming Soon) */}
        {statusBadge && (
          <div className="absolute top-3 left-3 z-10">
            <span className={`${statusBadge.color} text-xs font-semibold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1`}>
              <StatusIcon size={12} />
              {statusBadge.text}
            </span>
          </div>
        )}

        {/* Quick View Overlay */}
        {showQuickView && !isOutOfStock && !isComingSoon && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            <button className="bg-white text-gray-800 px-4 py-2 rounded-full text-sm font-medium hover:bg-orange-500 hover:text-white transition shadow-lg flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              <Eye size={16} />
              Quick View
            </button>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          disabled={loading}
          className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md hover:bg-white hover:scale-110 transition-all duration-200 disabled:opacity-50 z-20"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={18}
            className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}
          />
        </button>

        {/* Category Tag */}
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full z-10">
          {categoryName}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <Link href={`/products/${product.id}`} onClick={handleProductClick}>
          <h3 className="font-semibold text-gray-900 text-base line-clamp-1 hover:text-orange-500 transition">
            {productName}
          </h3>
        </Link>
        
        {/* Rating */}
        {reviewCount > 0 ? (
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={avgRating} size={14} />
            <span className="text-xs text-gray-400">({reviewCount})</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 mt-1">
            <Star size={12} className="text-gray-300" />
            <Star size={12} className="text-gray-300" />
            <Star size={12} className="text-gray-300" />
            <Star size={12} className="text-gray-300" />
            <Star size={12} className="text-gray-300" />
            <span className="text-xs text-gray-400 ml-1">No reviews</span>
          </div>
        )}
        
        {/* Price */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl font-bold text-orange-600">
            <CurrencyPrice amountUsd={priceMwk} />
          </span>
          {hasDiscount && product.compare_price && (
            <span className="text-sm text-gray-400 line-through">
              <CurrencyPrice amountUsd={Number(product.compare_price)} />
            </span>
          )}
        </div>

        {/* Stock Warning */}
        {!isOutOfStock && !isComingSoon && (product.stock_quantity ?? 0) > 0 && (product.stock_quantity ?? 0) <= 5 && (
          <p className="text-xs text-orange-500 mt-1">Only {product.stock_quantity} left in stock</p>
        )}

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          {!isOutOfStock && !isComingSoon ? (
            <>
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
              >
                <ShoppingCart size={16} />
                Add to Cart
              </button>
              <Link
                href={`/products/${product.id}`}
                onClick={handleProductClick}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:border-orange-300 hover:text-orange-500 transition flex items-center justify-center"
              >
                <Eye size={16} />
              </Link>
            </>
          ) : isComingSoon ? (
            <button className="w-full bg-gray-100 text-gray-500 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2">
              <Clock size={16} />
              Coming Soon
            </button>
          ) : (
            <button className="w-full bg-gray-100 text-gray-500 py-2.5 rounded-xl text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2">
              <Ban size={16} />
              Out of Stock
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
