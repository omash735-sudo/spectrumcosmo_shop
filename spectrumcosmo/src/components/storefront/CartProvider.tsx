'use client';

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

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
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = 'spectrumcosmo_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch logged‑in user
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => (res.ok ? res.json() : null))
      .then(data => setUser(data?.user || null))
      .catch(() => null);
  }, []);

  // Load cart (once user is known)
  const loadCart = useCallback(async () => {
    if (user) {
      try {
        const res = await fetch('/api/cart');
        const data = await res.json();
        if (data.items && data.items.length) {
          setItems(data.items);
        } else {
          // No cart in DB → check localStorage for guest cart
          const localCart = localStorage.getItem(STORAGE_KEY);
          if (localCart) {
            const localItems = JSON.parse(localCart);
            setItems(localItems);
            // Merge local cart into database
            await fetch('/api/cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: localItems }),
            });
            // Clear localStorage guest cart after merge
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (err) {
        console.error('Failed to load cart from DB', err);
      }
    } else {
      // Guest: load from localStorage
      const localCart = localStorage.getItem(STORAGE_KEY);
      if (localCart) {
        setItems(JSON.parse(localCart));
      }
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Save cart to both localStorage and database (if logged in)
  const saveCart = useCallback(
    async (newItems: CartItem[]) => {
      setItems(newItems);
      // Always save to localStorage (for guests and fallback)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      // If logged in, also save to database
      if (user) {
        try {
          await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: newItems }),
          });
        } catch (err) {
          console.error('Failed to save cart to DB', err);
        }
      }
    },
    [user]
  );

  const addItem = (item: Omit<CartItem, 'quantity'>, qty = 1) => {
    saveCart(prev => {
      const found = prev.find(i => i.id === item.id);
      if (found) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const removeItem = (id: string) => {
    saveCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQty = (id: string, qty: number) => {
    saveCart(prev =>
      prev.map(i => (i.id === id ? { ...i, quantity: Math.max(1, qty) } : i))
    );
  };

  const clearCart = () => {
    saveCart([]);
  };

  const totalItems = useMemo(
    () => items.reduce((s, i) => s + i.quantity, 0),
    [items]
  );

  const subtotalUsd = useMemo(
    () => items.reduce((s, i) => s + i.priceUsd * i.quantity, 0),
    [items]
  );

  if (isLoading) {
    // Optional: show a minimal loading state to avoid flashing empty cart
    return <div className="hidden" />;
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('CartProvider missing');
  return ctx;
};
