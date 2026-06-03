'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface WishlistItem {
  id: number;
  product_id: string;
  name: string;
  price: number;
  image: string;
  in_stock: boolean;
  rating?: number;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  loading: boolean;
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string) => Promise<boolean>;
  removeFromWishlist: (productId: string) => Promise<boolean>;
  toggleWishlist: (productId: string) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await fetch('/api/account/wishlist');
      const data = await res.json();
      
      // Handle both old and new response formats
      if (data.success && Array.isArray(data.data)) {
        setWishlist(data.data);
      } else if (Array.isArray(data)) {
        setWishlist(data);
      } else {
        setWishlist([]);
      }
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const isInWishlist = useCallback((productId: string) => {
    return wishlist.some(item => item.product_id === productId);
  }, [wishlist]);

  const addToWishlist = useCallback(async (productId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/account/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      
      const data = await res.json();
      if (data.success) {
        await fetchWishlist();
        toast.success('Added to wishlist');
        return true;
      } else {
        toast.error(data.error || 'Failed to add to wishlist');
        return false;
      }
    } catch (err) {
      console.error('Failed to add to wishlist:', err);
      toast.error('Failed to add to wishlist');
      return false;
    }
  }, [fetchWishlist]);

  const removeFromWishlist = useCallback(async (productId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/account/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      
      const data = await res.json();
      if (data.success) {
        await fetchWishlist();
        toast.success('Removed from wishlist');
        return true;
      } else {
        toast.error(data.error || 'Failed to remove from wishlist');
        return false;
      }
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
      toast.error('Failed to remove from wishlist');
      return false;
    }
  }, [fetchWishlist]);

  const toggleWishlist = useCallback(async (productId: string): Promise<boolean> => {
    if (isInWishlist(productId)) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist]);

  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider value={{
      wishlist,
      loading,
      wishlistCount,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      refreshWishlist: fetchWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
