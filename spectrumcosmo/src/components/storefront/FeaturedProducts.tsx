'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import CurrencyPrice from '@/components/storefront/CurrencyPrice';
import { useCart } from '@/components/storefront/CartProvider';
import { useState, useEffect } from 'react';

export default function FeaturedProductCard({ product }: { product: any }) {
  const priceUsd = Number(product.price ?? 0);
  const { addItem } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
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
      } catch (err) {}
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
      alert('Please login to save items');
      window.location.href = '/login';
      return;
    }

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
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Image container - taller for featured */}
      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
        <Link href={`/products/${product.id}`}>
          <Image
            src={product.image_url || '/placeholder.jpg'}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
        
        {/* Featured Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-[#F97316] text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
            🔥 Featured
          </span>
        </div>

        {/* Wishlist Heart - larger for featured */}
        <button
          onClick={toggleWishlist}
          className="absolute top-3 right-3 z-10 bg-white/90 rounded-full p-2 shadow-md hover:bg-white transition"
          aria-label="Save for later"
        >
          <Heart size={18} className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-bold text-gray-800 text-base line-clamp-2 hover:text-[#F97316] transition">
            {product.name}
          </h3>
        </Link>

        {/* Rating with star icon */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex items-center gap-0.5">
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold text-gray-700">{avgRating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-gray-400">({reviewCount} reviews)</span>
          </div>
        )}

        {/* Price */}
        <div className="mt-3">
          <span className="text-xl font-bold text-[#F97316]">
            <CurrencyPrice amountUsd={priceUsd} />
          </span>
        </div>

        {/* Action Buttons - full width */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => addItem({ id: String(product.id), name: product.name, image_url: product.image_url, priceUsd })}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition"
          >
            Add to Cart
          </button>
          <Link
            href={`/products/${product.id}`}
            className="flex-1 bg-[#F97316] hover:bg-orange-600 text-white py-2 rounded-lg text-sm font-medium text-center transition"
          >
            Buy Now
          </Link>
        </div>
      </div>
    </div>
  );
}
