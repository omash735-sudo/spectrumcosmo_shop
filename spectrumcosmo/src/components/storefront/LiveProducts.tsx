'use client'

import { useState, useEffect } from 'react'
import ProductCard from './ProductCard'

export default function LiveProducts({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState(initialProducts)

  useEffect(() => {
    let mounted = true
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/products')
        if (res.ok) {
          const data = await res.json()
          if (mounted) setProducts(data.slice(0, 6))
        }
      } catch (err) {
        // silently fail on polling
      }
    }

    const interval = setInterval(fetchLatest, 3000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  if (products.length === 0) {
    return <div className="text-center py-20 text-gray-400"><p>No products yet. Add some in the admin panel!</p></div>
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((p: any) => <ProductCard key={p.id} product={p} />)}
    </div>
  )
}
