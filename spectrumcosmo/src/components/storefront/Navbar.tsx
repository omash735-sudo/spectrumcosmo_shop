'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ShoppingBag } from 'lucide-react'
import { clsx } from 'clsx'

const links = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/#reviews', label: 'Reviews' },
  { href: '/#contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
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
          <div className="pt-2 pb-1">
            <Link href="/products" onClick={() => setOpen(false)} className="btn-primary w-full justify-center text-sm">Shop Now</Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
