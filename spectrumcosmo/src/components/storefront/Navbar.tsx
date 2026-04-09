'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Menu, X, ShoppingBag, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import CurrencySelector from '@/components/storefront/CurrencySelector'
import { useCart } from '@/components/storefront/CartProvider'
import { useCurrency } from '@/components/storefront/CurrencyProvider'
import { formatCurrencyAmount } from '@/lib/currency'

const links = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/#reviews', label: 'Reviews' },
  { href: '/#contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { items, totalItems, subtotalUsd, updateQty, removeItem } = useCart()
  const { currency, rates } = useCurrency()
  const subtotal = useMemo(() => subtotalUsd * (rates[currency] ?? 1), [subtotalUsd, rates, currency])

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setUser(data?.user || null))
      .catch(() => setUser(null))
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#F97316] rounded-lg flex items-center justify-center">
              <ShoppingBag size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#111111]" style={{fontFamily:'var(--font-display)'}}>
              Spectrum<span className="text-[#F97316]">Cosmo</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link key={l.href} href={l.href} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#F97316] rounded-lg hover:bg-orange-50 transition-all">{l.label}</Link>
            ))}
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <CurrencySelector />
            {user ? (
              <>
                <Link href="/account" className="text-sm font-medium text-gray-600 hover:text-[#F97316]">{user.name?.split(' ')[0] || 'My Account'}</Link>
                <button onClick={() => setCartOpen(true)} className="relative p-2 rounded-lg hover:bg-orange-50 text-gray-700">
                  <ShoppingCart size={18} />
                  {totalItems > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#F97316] text-white text-[10px] grid place-items-center">{totalItems}</span>}
                </button>
                <button onClick={logout} className="text-sm font-medium text-gray-600 hover:text-[#F97316]">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-[#F97316]">Sign In</Link>
                <Link href="/signup" className="btn-secondary text-sm py-2 px-4">Sign Up</Link>
              </>
            )}
            <Link href="/products" className="btn-primary text-sm">Shop Now</Link>
          </div>
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      <div className={clsx('md:hidden border-t border-gray-100 bg-white overflow-hidden transition-all duration-200', open?'max-h-96':'max-h-0')}>
        <nav className="px-4 py-3 space-y-1">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#F97316] hover:bg-orange-50 rounded-lg">{l.label}</Link>
          ))}
          <div className="px-4 py-2">
            <CurrencySelector />
          </div>
          {user ? (
            <>
              <Link href="/account" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#F97316] hover:bg-orange-50 rounded-lg">My Account</Link>
              <button onClick={() => { setCartOpen(true); setOpen(false) }} className="w-full text-left block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#F97316] hover:bg-orange-50 rounded-lg">Cart ({totalItems})</button>
              <button onClick={logout} className="w-full text-left block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#F97316] hover:bg-orange-50 rounded-lg">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#F97316] hover:bg-orange-50 rounded-lg">Sign In</Link>
              <Link href="/signup" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#F97316] hover:bg-orange-50 rounded-lg">Sign Up</Link>
            </>
          )}
          <div className="pt-2 pb-1">
            <Link href="/products" onClick={() => setOpen(false)} className="btn-primary w-full justify-center text-sm">Shop Now</Link>
          </div>
        </nav>
      </div>

      {cartOpen && (
        <div className="fixed inset-0 z-[70]">
          <button className="absolute inset-0 bg-black/35" onClick={() => setCartOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-[#111111]">Your Cart</h3>
              <button onClick={() => setCartOpen(false)} className="p-2 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {items.length === 0 ? (
                <div className="p-6 text-sm text-gray-500">Your cart is empty.</div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="p-4">
                    <p className="font-medium text-sm text-[#111111]">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatCurrencyAmount(item.priceUsd * (rates[currency] ?? 1), currency)} each</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-7 h-7 rounded border grid place-items-center"><Minus size={14} /></button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-7 h-7 rounded border grid place-items-center"><Plus size={14} /></button>
                      </div>
                      <button onClick={() => removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-5 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold">{formatCurrencyAmount(subtotal, currency)}</span>
              </div>
              <Link href="/checkout" onClick={() => setCartOpen(false)} className="btn-primary w-full justify-center">
                Checkout
              </Link>
              <button onClick={() => setCartOpen(false)} className="btn-secondary w-full justify-center">
                Continue Browsing
              </button>
            </div>
          </aside>
        </div>
      )}
    </header>
  )
}
