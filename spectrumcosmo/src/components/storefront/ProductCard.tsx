'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart, Plus } from 'lucide-react';
import CurrencyPrice from '@/components/storefront/CurrencyPrice';
import { useCart } from '@/components/storefront/CartProvider';
import { useState, useEffect } from 'react';
import StarRating from '@/components/ui/StarRating';

export default function ProductCard({ product }: { product: any }) {
  // Early return if product is missing
  if (!product) return null;

  const priceUsd = Number(product.price ?? 0);
  const { addItem } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

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

    fetch(`/api/reviews?product_id=${product.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.length) {
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

  return (
    <div className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition">
      <div className="relative h-48 sm:h-56 bg-gray-100 overflow-hidden">
        <Link href={`/products/${product.id}`}>
          <Image
            src={product.image_url || 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600'}
            alt={product.name || 'Product'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </Link>
        <button
          onClick={toggleWishlist}
          disabled={loadingWishlist}
          className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow-sm hover:bg-white transition disabled:opacity-50"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={16} className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-500'} />
        </button>
        {product.category && (
          <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
            {product.category}
          </span>
        )}
      </div>
      <div className="p-2.5 sm:p-3">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-800 truncate text-xs sm:text-sm">{product.name || 'Unnamed Product'}</h3>
        </Link>
        {reviewCount > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <StarRating rating={avgRating} size={12} />
            <span className="text-[10px] sm:text-xs text-gray-500">({reviewCount})</span>
          </div>
        )}
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-sm sm:text-base font-bold text-[#F97316]">
            <CurrencyPrice amountUsd={priceUsd} />
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => addItem({ 
                id: String(product.id), 
                name: product.name || 'Product', 
                image_url: product.image_url, 
                priceUsd 
              })}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-1 rounded-full transition"
              aria-label="Add to cart"
            >
              <Plus size={14} />
            </button>
            <Link
              href={`/products/${product.id}`}
              className="bg-[#F97316] hover:bg-orange-600 text-white p-1 rounded-full transition"
              aria-label="Buy now"
            >
              <ShoppingCart size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
