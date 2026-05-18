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
};

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = 'spectrumcosmo_cart';
const POLL_INTERVAL_MS = 5000;

// Helper to get session ID from cookie (client-side)
function getSessionIdFromCookie(): string | null {
  const match = document.cookie.match(/user_session_id=([^;]+)/);
  return match ? match[1] : null;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);

  // Fetch logged-in user
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => (res.ok ? res.json() : null))
      .then(data => setUser(data?.user || null))
      .catch(() => null);
  }, []);

  // Get session ID from cookie (set by middleware)
  useEffect(() => {
    const sid = getSessionIdFromCookie();
    setSessionId(sid);
  }, []);

  // Fetch cart from database (for both guest and logged-in)
  const fetchCartFromDB = useCallback(async () => {
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      return data.items || [];
    } catch (err) {
      console.error('Failed to fetch cart from DB', err);
      return null;
    }
  }, []);

  // Save cart to database (for both guest and logged-in)
  const saveCartToDB = useCallback(async (cartItems: CartItem[]) => {
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartItems }),
      });
    } catch (err) {
      console.error('Failed to save cart to DB', err);
    }
  }, []);

  // Load initial cart
  const loadCart = useCallback(async () => {
    const dbCart = await fetchCartFromDB();
    if (dbCart && dbCart.length) {
      // Database has cart (either from guest or logged-in)
      setItems(dbCart);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dbCart));
    } else {
      // No cart in DB, load from localStorage
      const localCart = localStorage.getItem(STORAGE_KEY);
      if (localCart) {
        const localItems = JSON.parse(localCart);
        setItems(localItems);
        // Sync local cart to DB
        await saveCartToDB(localItems);
      }
    }
    setIsLoading(false);
  }, [fetchCartFromDB, saveCartToDB]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  // Poll for changes (when user logs in/out or multiple tabs)
  useEffect(() => {
    const poll = async () => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      const dbCart = await fetchCartFromDB();
      if (dbCart) {
        setItems(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(dbCart)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dbCart));
            return dbCart;
          }
          return prev;
        });
      }
      isSyncingRef.current = false;
    };
    pollIntervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [fetchCartFromDB]);

  // Save cart to both localStorage and database
  const saveCart = useCallback(
    async (newItems: CartItem[]) => {
      setItems(newItems);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
      await saveCartToDB(newItems);
    },
    [saveCartToDB]
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
