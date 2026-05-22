'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';

export type CartItem = {
  id: string;
  name: string;
  image_url?: string;
  priceUsd: number;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotalUsd: number;
  isLoading: boolean;
};

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = 'spectrumcosmo_cart';
const SYNC_INTERVAL_MS = 30000; // 30 seconds - less frequent to avoid race conditions

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const isSyncingRef = useRef(false);
  const lastSyncRef = useRef<number>(Date.now());
  const localItemsRef = useRef<CartItem[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    localItemsRef.current = items;
  }, [items]);

  // Check if user is logged in
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => setIsLoggedIn(!!data?.user))
      .catch(() => setIsLoggedIn(false));
  }, []);

  // Load cart once on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        // Load from localStorage first (instant UI)
        const localCart = localStorage.getItem(STORAGE_KEY);
        let initialItems: CartItem[] = [];
        
        if (localCart) {
          initialItems = JSON.parse(localCart);
          setItems(initialItems);
        }

        // Fetch from server and merge
        const res = await fetch('/api/cart', {
          cache: 'no-store',
        });
        
        if (res.ok) {
          const data = await res.json();
          const serverItems = data.items || [];
          
          if (serverItems.length > 0) {
            // Server has items - use them (source of truth for logged-in users)
            setItems(serverItems);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(serverItems));
            lastSyncRef.current = Date.now();
          } else if (initialItems.length > 0 && !isLoggedIn) {
            // Guest with local items - sync to server
            await fetch('/api/cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: initialItems }),
            });
          }
        }
      } catch (err) {
        console.error('Failed to load cart:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [isLoggedIn]);

  // Save to both localStorage and server
  const saveCart = useCallback(async (newItems: CartItem[], skipSyncRef = false) => {
    // Update state
    setItems(newItems);
    
    // Save to localStorage always
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    
    if (!skipSyncRef) {
      lastSyncRef.current = Date.now();
    }
    
    // Save to server
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newItems }),
      });
    } catch (err) {
      console.error('Failed to save cart to server:', err);
    }
  }, []);

  // Poll for cross-device sync (only when logged in)
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const syncWithServer = async () => {
      // Don't sync if already syncing
      if (isSyncingRef.current) return;
      
      // Don't sync if we just saved (within 5 seconds)
      if (Date.now() - lastSyncRef.current < 5000) return;
      
      isSyncingRef.current = true;
      
      try {
        const res = await fetch('/api/cart', { cache: 'no-store' });
        if (!res.ok) return;
        
        const data = await res.json();
        const serverItems = data.items || [];
        const currentItems = localItemsRef.current;
        
        // CRITICAL: Never replace a non-empty cart with an empty one
        if (currentItems.length > 0 && serverItems.length === 0) {
          console.log('Preventing empty sync - keeping local cart');
          return;
        }
        
        // Compare and update if different
        const currentStr = JSON.stringify(currentItems);
        const serverStr = JSON.stringify(serverItems);
        
        if (currentStr !== serverStr) {
          console.log('Cross-device sync: updating cart from server');
          setItems(serverItems);
          localStorage.setItem(STORAGE_KEY, serverStr);
        }
      } catch (err) {
        console.error('Sync error:', err);
      } finally {
        isSyncingRef.current = false;
      }
    };
    
    const interval = setInterval(syncWithServer, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Also sync when tab becomes visible again (user returns to tab)
  useEffect(() => {
    if (!isLoggedIn) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Trigger a sync when tab becomes visible
        setTimeout(async () => {
          if (isSyncingRef.current) return;
          if (Date.now() - lastSyncRef.current < 3000) return;
          
          isSyncingRef.current = true;
          try {
            const res = await fetch('/api/cart', { cache: 'no-store' });
            if (res.ok) {
              const data = await res.json();
              const serverItems = data.items || [];
              const currentItems = localItemsRef.current;
              
              // Never replace non-empty cart with empty one
              if (currentItems.length > 0 && serverItems.length === 0) return;
              
              const currentStr = JSON.stringify(currentItems);
              const serverStr = JSON.stringify(serverItems);
              
              if (currentStr !== serverStr) {
                setItems(serverItems);
                localStorage.setItem(STORAGE_KEY, serverStr);
              }
            }
          } catch (err) {
            console.error('Visibility sync error:', err);
          } finally {
            isSyncingRef.current = false;
            lastSyncRef.current = Date.now();
          }
        }, 100);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isLoggedIn]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      let newItems;
      if (existing) {
        newItems = prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + qty } : i
        );
      } else {
        newItems = [...prev, { ...item, quantity: qty }];
      }
      saveCart(newItems, true);
      return newItems;
    });
  }, [saveCart]);

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const newItems = prev.filter(i => i.id !== id);
      saveCart(newItems, true);
      return newItems;
    });
  }, [saveCart]);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty < 1) return;
    setItems(prev => {
      const newItems = prev.map(i => (i.id === id ? { ...i, quantity: qty } : i));
      saveCart(newItems, true);
      return newItems;
    });
  }, [saveCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    saveCart([], true);
  }, [saveCart]);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotalUsd = useMemo(
    () => items.reduce((sum, item) => sum + item.priceUsd * item.quantity, 0),
    [items]
  );

  if (isLoading) {
    return null;
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        totalItems,
        subtotalUsd,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
