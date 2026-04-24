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
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
  clearCart: () => void
  totalItems: number
  subtotalUsd: number
}

const CartContext = createContext<CartContextType | null>(null)

const STORAGE_KEY = 'spectrumcosmo_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) setItems(JSON.parse(data))
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (item: Omit<CartItem, 'quantity'>, qty = 1) => {
    setItems(prev => {
      const found = prev.find(i => i.id === item.id)
      if (found) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + qty } : i
        )
      }
      return [...prev, { ...item, quantity: qty }]
    })
  }

  const removeItem = (id: string) =>
    setItems(prev => prev.filter(i => i.id !== id))

  const updateQty = (id: string, qty: number) =>
    setItems(prev =>
      prev.map(i =>
        i.id === id ? { ...i, quantity: Math.max(1, qty) } : i
      )
    )

  const clearCart = () => setItems([])

  const totalItems = useMemo(
    () => items.reduce((s, i) => s + i.quantity, 0),
    [items]
  )

  const subtotalUsd = useMemo(
    () => items.reduce((s, i) => s + i.priceUsd * i.quantity, 0),
    [items]
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        totalItems,
        subtotalUsd
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('CartProvider missing')
  return ctx
}
