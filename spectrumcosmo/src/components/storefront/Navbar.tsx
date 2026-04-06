'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, ShoppingBag, User, LogOut, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'

const links = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/#reviews', label: 'Reviews' },
  { href: '/#contact', label: 'Contact' },
]

interface UserInfo {
  name: string
  email: string
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) setUser(data.user)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setDropdownOpen(false)
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#F97316] rounded-lg flex items-center justify-center">
              <ShoppingBag size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#111111]">
              Spectrum<span className="text-[#F97316]">Cosmo</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link key={l.href} href={l.href}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#F97316] rounded-lg hover:bg-orange-50 transition-all">
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-8 bg-gray-100 rounded-lg animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-orange-50 transition-all text-sm font-medium text-gray-700"
                >
                  <div className="w-7 h-7 bg-[#F97316] rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                  <ChevronDown size={14} className={clsx('transition-transform', dropdownOpen && 'rotate-180')} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-xs font-semibold text-gray-800 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <Link href="/account"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-[#F97316] hover:bg-orange-50 transition-all">
                      <User size={14} /> My Account
                    </Link>
                    <Link href="/account/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-[#F97316] hover:bg-orange-50 transition-all">
                      <ShoppingBag size={14} /> My Orders
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-all w-full text-left">
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#F97316] rounded-lg hover:bg-orange-50 transition-all">
                  Sign In
                </Link>
                <Link href="/auth/register"
                  className="btn-primary text-sm">
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={clsx('md:hidden border-t border-gray-100 bg-white overflow-hidden transition-all duration-200', open ? 'max-h-[500px]' : 'max-h-0')}>
        <nav className="px-4 py-3 space-y-1">
          {links.map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#F97316] hover:bg-orange-50 rounded-lg">
              {l.label}
            </Link>
          ))}

          <div className="pt-2 pb-1 border-t border-gray-100 space-y-2">
            {user ? (
              <>
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <Link href="/account" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#F97316] hover:bg-orange-50 rounded-lg">
                  <User size={14} /> My Account
                </Link>
                <Link href="/account/orders" onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#F97316] hover:bg-orange-50 rounded-lg">
                  <ShoppingBag size={14} /> My Orders
                </Link>
                <button onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg w-full">
                  <LogOut size={14} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setOpen(false)}
                  className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-[#F97316] hover:bg-orange-50 rounded-lg">
                  Sign In
                </Link>
                <Link href="/auth/register" onClick={() => setOpen(false)}
                  className="btn-primary w-full justify-center text-sm">
                  Create Account
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
