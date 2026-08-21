'use client'

import { useState, useEffect } from 'react'
import ProductCard from './ProductCard'

export default function LiveProducts({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Only fetch when tab is visible
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    let mounted = true
    let interval: NodeJS.Timeout

    const fetchLatest = async () => {
      if (!isVisible) return // Skip if tab not visible
      try {
        const res = await fetch('/api/products')
        if (res.ok) {
          const data = await res.json()
          if (mounted) setProducts(data.slice(0, 6))
        }
      } catch (err) {
        // silently fail
      }
    }

    // Fetch immediately, then every 60 seconds
    fetchLatest()
    interval = setInterval(fetchLatest, 60000) // Increased to 60 seconds

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [isVisible])

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="font-kanit text-[var(--foreground-muted)]">No products yet. Add some in the admin panel!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((p: any) => <ProductCard key={p.id} product={p} />)}
    </div>
  )
}
