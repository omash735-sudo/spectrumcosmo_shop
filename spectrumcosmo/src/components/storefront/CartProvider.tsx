'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type CartItem = {
  id: string
  name: string
  image_url?: string
  priceUsd: number
  quantity: number
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (id: string) => void
  updateQty: (id: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  subtotalUsd: number
}

const CartContext = createContext<CartContextType | null>(null)
const STORAGE_KEY = 'spectrumcosmo_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as CartItem[]
      if (Array.isArray(parsed)) setItems(parsed)
    } catch {
      // ignore invalid local storage data
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.id === item.id)
      if (existing) {
        return prev.map((p) => (p.id === item.id ? { ...p, quantity: p.quantity + quantity } : p))
      }
      return [...prev, { ...item, quantity }]
    })
  }

  const removeItem = (id: string) => setItems((prev) => prev.filter((p) => p.id !== id))

  const updateQty = (id: string, quantity: number) => {
    if (quantity <= 0) return removeItem(id)
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, quantity } : p)))
  }

  const clearCart = () => setItems([])

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items])
  const subtotalUsd = useMemo(() => items.reduce((sum, i) => sum + i.priceUsd * i.quantity, 0), [items])

  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQty, clearCart, totalItems, subtotalUsd }),
    [items, totalItems, subtotalUsd],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

