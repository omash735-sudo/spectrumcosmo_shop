'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Star, ShoppingCart, Heart, Loader2, Trash2, ArrowLeft, Package, 
  MessageSquare, X, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { useCart } from '@/components/storefront/CartProvider';
import { useWishlist } from '@/components/storefront/WishlistProvider';
import CurrencyPrice from '@/components/storefront/CurrencyPrice';
import RequestStatusBadge from '@/components/requests/RequestStatusBadge';
import toast from 'react-hot-toast';

const MAX_STARS = 5;

interface Request {
  id: string;
  title: string;
  description: string;
  status: string;
  like_count: number;
  created_at: string;
  category_name: string;
  image_count: number;
}

export default function WishlistPage() {
  const { wishlist, loading, removeFromWishlist, refreshWishlist } = useWishlist();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const { addItem } = useCart();
  
  // My Requests state
  const [activeTab, setActiveTab] = useState<'saved' | 'requests'>('saved');
  const [myRequests, setMyRequests] = useState<Request[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Load my requests when tab switches
  const loadMyRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch('/api/requests?status=my&limit=50');
      if (!res.ok) throw new Error('Failed to load requests');
      const data = await res.json();
      setMyRequests(data.data || []);
    } catch (err) {
      console.error('Failed to load my requests:', err);
      toast.error('Failed to load your requests');
    } finally {
      setLoadingRequests(false);
    }
  };

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
    toast.success(`${item.name} added to cart!`);
  }, [addItem]);

  const handleMoveToCart = useCallback(async (item: any) => {
    setMovingId(item.product_id);
    try {
      // Add to cart
      addItem({
        id: String(item.product_id),
        name: item.name,
        image_url: item.image || undefined,
        priceUsd: item.price,
      });
      
      // Remove from wishlist
      await removeFromWishlist(item.product_id);
      
      toast.success(`${item.name} moved to cart!`);
    } catch (err) {
      toast.error('Failed to move to cart');
    } finally {
      setMovingId(null);
    }
  }, [addItem, removeFromWishlist]);

  const getFormattedRating = (rating: number | undefined): string => {
    const effectiveRating = rating ?? 0;
    return effectiveRating.toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-orange-500 w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 md:py-8 lg:py-12">
      
      {/* Header with back button */}
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Link 
          href="/account" 
          className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          aria-label="Back to account"
        >
          <ArrowLeft size={16} className="text-gray-700 dark:text-gray-300 sm:w-5 sm:h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-1 h-5 sm:h-7 bg-orange-500 rounded-full"></div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              My Wishlist
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-0.5 sm:mt-1">
            {activeTab === 'saved' 
              ? `${wishlist.length} ${wishlist.length === 1 ? 'item' : 'items'} saved`
              : `${myRequests.length} ${myRequests.length === 1 ? 'request' : 'requests'} submitted`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6 w-full sm:w-auto">
        <button
          onClick={() => {
            setActiveTab('saved');
          }}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'saved'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Saved Items
        </button>
        <button
          onClick={() => {
            setActiveTab('requests');
            loadMyRequests();
          }}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'requests'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          My Requests
        </button>
      </div>

      {/* ============================================
          TAB 1: SAVED ITEMS
          ============================================ */}
      {activeTab === 'saved' && (
        <>
          {wishlist.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 p-8 sm:p-12 text-center shadow-sm">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-gray-300 dark:text-gray-500 sm:w-10 sm:h-10" />
              </div>
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Your wishlist is empty</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-5 sm:mb-6">Save your favorite items here</p>
              <Link
                href="/products"
                className="inline-block bg-orange-500 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-orange-600 transition"
              >
                Browse Products →
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                {wishlist.map((item) => {
                  const hasRating = item.rating && item.rating > 0;
                  
                  return (
                    <div
                      key={item.id}
                      className="group bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                    >
                      {/* Product Image */}
                      <Link href={`/product/${item.product_id}`}>
                        <div className="relative h-40 sm:h-44 md:h-48 bg-gray-50 dark:bg-gray-700 overflow-hidden">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover group-hover:scale-105 transition duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={32} className="text-gray-400 dark:text-gray-500 sm:w-10 sm:h-10 md:w-12 md:h-12" />
                            </div>
                          )}
                          {!item.in_stock && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="bg-red-100 dark:bg-red-900/80 text-red-700 dark:text-red-300 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                                Out of Stock
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>

                      <div className="p-3 sm:p-4">
                        {/* Product Name */}
                        <Link href={`/product/${item.product_id}`}>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base md:text-lg line-clamp-1 hover:text-orange-500 dark:hover:text-orange-400 transition">
                            {item.name}
                          </h3>
                        </Link>

                        {/* Rating */}
                        {hasRating && (
                          <div className="flex items-center gap-1 mt-1.5 sm:mt-2">
                            <div className="flex">
                              {[...Array(MAX_STARS)].map((_, starIndex) => {
                                const starNumber = starIndex + 1;
                                const isFilled = starNumber <= Math.floor(item.rating ?? 0);
                                return (
                                  <Star
                                    key={starIndex}
                                    size={12}
                                    className={`sm:w-3.5 sm:h-3.5 ${
                                      isFilled
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                            <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 ml-0.5 sm:ml-1">
                              {getFormattedRating(item.rating)}
                            </span>
                          </div>
                        )}

                        {/* Price */}
                        <CurrencyPrice 
                          amountUsd={item.price} 
                          className="text-orange-500 dark:text-orange-400 font-bold text-base sm:text-lg md:text-xl mt-2 sm:mt-3 inline-block"
                        />

                        {/* Stock status */}
                        <p
                          className={`text-[10px] sm:text-xs mt-1 ${
                            item.in_stock 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-500 dark:text-red-400'
                          }`}
                        >
                          {item.in_stock ? 'In stock' : 'Out of stock'}
                        </p>

                        {/* Action buttons */}
                        <div className="flex gap-2 mt-3 sm:mt-4">
                          <button
                            onClick={() => handleMoveToCart(item)}
                            disabled={!item.in_stock || movingId === item.product_id}
                            className={`flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 transition-all ${
                              item.in_stock
                                ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {movingId === item.product_id ? (
                              <Loader2 size={12} className="animate-spin sm:w-4 sm:h-4" />
                            ) : (
                              <ShoppingCart size={12} className="sm:w-4 sm:h-4" />
                            )}
                            <span>{movingId === item.product_id ? 'Moving...' : 'Move to cart'}</span>
                          </button>
                          
                          <button
                            onClick={() => handleRemoveFromWishlist(item.product_id)}
                            disabled={removingId === item.product_id}
                            className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-800 transition disabled:opacity-50"
                            aria-label="Remove from wishlist"
                          >
                            {removingId === item.product_id ? (
                              <Loader2 size={12} className="animate-spin text-red-500 sm:w-4 sm:h-4" />
                            ) : (
                              <Trash2 size={12} className="text-red-500 dark:text-red-400 sm:w-4 sm:h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Refresh button */}
              <div className="mt-6 sm:mt-8 text-center">
                <button
                  onClick={() => refreshWishlist()}
                  className="text-[11px] sm:text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  Refresh wishlist
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* ============================================
          TAB 2: MY REQUESTS
          ============================================ */}
      {activeTab === 'requests' && (
        <>
          {loadingRequests ? (
            <div className="flex justify-center py-20">
              <Loader2 size={32} className="animate-spin text-orange-500" />
            </div>
          ) : myRequests.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 p-8 sm:p-12 text-center shadow-sm">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={32} className="text-gray-300 dark:text-gray-500 sm:w-10 sm:h-10" />
              </div>
              <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No requests yet</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-5 sm:mb-6">Submit your first product request</p>
              <Link
                href="/requests/submit"
                className="inline-block bg-orange-500 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium hover:bg-orange-600 transition"
              >
                Submit a Request →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {myRequests.map((req) => (
                <Link
                  key={req.id}
                  href={`/requests/${req.id}`}
                  className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1 text-sm sm:text-base">
                        {req.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {req.description}
                      </p>
                      {req.category_name && (
                        <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-1 inline-block">
                          {req.category_name}
                        </span>
                      )}
                    </div>
                    <RequestStatusBadge status={req.status} size="sm" />
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Heart size={14} className="text-gray-400 dark:text-gray-500" />
                      {req.like_count} votes
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} className="text-gray-400 dark:text-gray-500" />
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                    {req.image_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Package size={14} className="text-gray-400 dark:text-gray-500" />
                        {req.image_count} {req.image_count === 1 ? 'image' : 'images'}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
