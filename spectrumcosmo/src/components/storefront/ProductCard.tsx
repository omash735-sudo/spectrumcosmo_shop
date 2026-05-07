'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart, Plus, CheckCircle, Clock, AlertCircle, Ban } from 'lucide-react';
import CurrencyPrice from '@/components/storefront/CurrencyPrice';
import { useCart } from '@/components/storefront/CartProvider';
import { useState, useEffect } from 'react';
import StarRating from '@/components/ui/StarRating';

export default function ProductCard({ product }: { product: any }) {
  // Guard clause - if product is missing, return nothing
  if (!product || !product.id) {
    console.warn('ProductCard received invalid product:', product);
    return null;
  }

  const priceUsd = Number(product.price ?? 0);
  const { addItem } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  // Get status badge configuration
  const getStatusBadge = () => {
    const status = product.status || 'in_stock';
    const stock = product.stock_quantity ?? 0;
    
    if (status === 'out_of_stock') {
      return { text: 'Out of Stock', color: 'bg-red-100 text-red-700', icon: Ban };
    }
    if (status === 'coming_soon') {
      return { text: 'Coming Soon', color: 'bg-yellow-100 text-yellow-700', icon: Clock };
    }
    if (status === 'pre_order') {
      return { text: 'Pre-Order', color: 'bg-blue-100 text-blue-700', icon: AlertCircle };
    }
    if (stock === 0) {
      return { text: 'Out of Stock', color: 'bg-red-100 text-red-700', icon: Ban };
    }
    return { text: 'In Stock', color: 'bg-green-100 text-green-700', icon: CheckCircle };
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;
  const isOutOfStock = product.status === 'out_of_stock' || product.stock_quantity === 0;
  const isComingSoon = product.status === 'coming_soon';

  // Check if product is in wishlist
  useEffect(() => {
    const checkWishlist = async () => {
      try {
        const res = await fetch('/api/account/wishlist');
        if (res.ok) {
          const wishlist = await res.json();
          const exists = wishlist.some((item: any) => item.id === product.id || item.product_id === product.id);
          setIsWishlisted(exists);
        }
      } catch (err) {
        console.error('Failed to fetch wishlist', err);
      } finally {
        setLoadingWishlist(false);
      }
    };
    checkWishlist();

    // Fetch rating
    fetch(`/api/reviews?product_id=${product.id}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length) {
          const sum = data.reduce((s: number, r: any) => s + r.rating, 0);
          setAvgRating(sum / data.length);
          setReviewCount(data.length);
        }
      })
      .catch(console.error);
  }, [product.id]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if user is logged in
    const userRes = await fetch('/api/auth/me');
    if (!userRes.ok) {
      alert('Please login to add items to wishlist');
      window.location.href = '/login';
      return;
    }

    setLoadingWishlist(true);
    try {
      if (isWishlisted) {
        await fetch('/api/account/wishlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id }),
        });
        setIsWishlisted(false);
      } else {
        await fetch('/api/account/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id }),
        });
        setIsWishlisted(true);
      }
    } catch (err) {
      console.error('Wishlist error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoadingWishlist(false);
    }
  };

  const productName = product.name || 'Product';
  const productImage = product.image_url || 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600';
  const categoryName = product.category_name || product.category || 'Uncategorized';

  return (
    <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition">
      <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden bg-gray-50">
        <Link href={`/products/${product.id}`}>
          <Image
            src={productImage}
            alt={productName}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        
        {/* Wishlist heart button */}
        <button
          onClick={toggleWishlist}
          disabled={loadingWishlist}
          className="absolute top-2 right-2 bg-white/80 rounded-full p-1.5 shadow-sm hover:bg-white transition disabled:opacity-50"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            size={18}
            className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-500'}
          />
        </button>
        
        {/* Category tag */}
        <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] sm:text-xs px-2 py-0.5 rounded backdrop-blur-sm">
          {categoryName}
        </span>

        {/* Status badge - shown prominently on image */}
        {(isOutOfStock || isComingSoon) && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold ${statusBadge.color} shadow-lg`}>
              <StatusIcon size={14} className="inline mr-1" />
              {statusBadge.text}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-3 sm:p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-800 line-clamp-1 text-sm sm:text-base">
            {productName}
          </h3>
        </Link>
        
        {reviewCount > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <StarRating rating={avgRating} size={14} />
            <span className="text-xs text-gray-500">({reviewCount})</span>
          </div>
        )}
        
        <div className="mt-2 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-bold text-[#F97316]">
              <CurrencyPrice amountUsd={priceUsd} />
            </span>
            {/* Small stock indicator for in-stock items */}
            {!isOutOfStock && !isComingSoon && product.stock_quantity > 0 && product.stock_quantity < 10 && (
              <span className="text-[10px] text-orange-500">Only {product.stock_quantity} left</span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {!isOutOfStock && !isComingSoon ? (
              <>
                <button
                  onClick={() => addItem({ id: String(product.id), name: productName, image_url: productImage, priceUsd })}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-1.5 rounded-full transition"
                  aria-label="Add to cart"
                >
                  <Plus size={16} />
                </button>
                <Link
                  href={`/products/${product.id}`}
                  className="bg-[#F97316] hover:bg-orange-600 text-white p-1.5 rounded-full transition"
                  aria-label="Buy now"
                >
                  <ShoppingCart size={16} />
                </Link>
              </>
            ) : isComingSoon ? (
              <span className="text-xs text-gray-400 px-2 py-1">Notify Me</span>
            ) : (
              <span className="text-xs text-gray-400 px-2 py-1">Unavailable</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
