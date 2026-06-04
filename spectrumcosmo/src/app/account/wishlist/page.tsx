'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Heart, Loader2, Trash2, ArrowLeft } from 'lucide-react';
import { useCart } from '@/components/storefront/CartProvider';
import { useWishlist } from '@/components/storefront/WishlistProvider';
import CurrencyPrice from '@/components/storefront/CurrencyPrice';

// Constants
const MAX_STARS = 5;

export default function WishlistPage() {
  const { wishlist, loading, removeFromWishlist, refreshWishlist } = useWishlist();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { addItem } = useCart();

  const handleRemoveFromWishlist = useCallback(async (productId: string) => {
    setRemovingId(productId);
    await removeFromWishlist(productId);
    setRemovingId(null);
  }, [removeFromWishlist]);

  const handleAddToCart = useCallback((item: any) => {
    addItem({
      id: String(item.product_id),
      name: item.name,
      image_url: item.image || undefined,
      priceUsd: item.price,
    });
  }, [addItem]);

  const getFormattedRating = (rating: number | undefined): string => {
    const effectiveRating = rating ?? 0;
    return effectiveRating.toFixed(1);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-orange-500 w-8 h-8 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/account" 
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          aria-label="Back to account"
        >
          <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            My Wishlist
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved for later
          </p>
        </div>
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center shadow-sm">
          <Heart className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Save your favorite items here</p>
          <Link
            href="/products"
            className="inline-block bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition"
          >
            Browse Products →
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((item) => {
            const hasRating = (item.rating ?? 0) > 0;
            
            return (
              <div
                key={item.id}
                className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1"
              >
                {/* Product Image */}
                <Link href={`/product/${item.product_id}`}>
                  <div className="relative h-48 bg-gray-50 dark:bg-gray-800 overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">
                        📦
                      </div>
                    )}
                    {!item.in_stock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs px-2 py-1 rounded">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  {/* Product Name */}
                  <Link href={`/product/${item.product_id}`}>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg line-clamp-1 hover:text-orange-500 dark:hover:text-orange-400 transition">
                      {item.name}
                    </h3>
                  </Link>

                  {/* Rating */}
                  {hasRating && (
                    <div className="flex items-center gap-1 mt-2">
                      <div className="flex">
                        {[...Array(MAX_STARS)].map((_, starIndex) => {
                          const starNumber = starIndex + 1;
                          const isFilled = starNumber <= Math.floor(item.rating ?? 0);
                          return (
                            <Star
                              key={starIndex}
                              size={14}
                              className={
                                isFilled
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }
                            />
                          );
                        })}
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                        {getFormattedRating(item.rating)}
                      </span>
                    </div>
                  )}

                  {/* Price */}
                  <CurrencyPrice 
                    amount={item.price} 
                    className="text-orange-500 dark:text-orange-400 font-bold text-xl mt-3"
                  />

                  {/* Stock status */}
                  <p
                    className={`text-xs mt-1 ${
                      item.in_stock 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-500 dark:text-red-400'
                    }`}
                  >
                    {item.in_stock ? '✓ In stock' : '✗ Out of stock'}
                  </p>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleAddToCart(item)}
                      disabled={!item.in_stock}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                        item.in_stock
                          ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingCart size={16} />
                      Add to cart
                    </button>
                    
                    <button
                      onClick={() => handleRemoveFromWishlist(item.product_id)}
                      disabled={removingId === item.product_id}
                      className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-800 transition disabled:opacity-50"
                      aria-label="Remove from wishlist"
                    >
                      {removingId === item.product_id ? (
                        <Loader2 size={16} className="animate-spin text-red-500" />
                      ) : (
                        <Trash2 size={16} className="text-red-500 dark:text-red-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Refresh button */}
      {wishlist.length > 0 && (
        <div className="mt-8 text-center">
          <button
            onClick={() => refreshWishlist()}
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            Refresh wishlist
          </button>
        </div>
      )}
    </div>
  );
}
