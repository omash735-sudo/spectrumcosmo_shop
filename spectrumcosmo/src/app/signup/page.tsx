'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Eye, EyeOff, Loader2, ShoppingBag } from 'lucide-react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'Signup failed')
      setLoading(false)
      return
    }
    window.location.href = '/account'
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#111111] flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(circle, #F97316 1px, transparent 1px)', backgroundSize: '32px 32px' }}
          />
        </div>
        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#F97316] rounded-xl flex items-center justify-center">
                <ShoppingBag size={20} className="text-white" />
              </div>
              <span className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                SpectrumCosmo
              </span>
            </div>
            <p className="text-gray-400 text-sm">Start your journey</p>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <h1 className="text-2xl font-bold text-[#111111] mb-1">Create account</h1>
            <p className="text-gray-500 text-sm mb-8">Join SpectrumCosmo and shop with ease.</p>
            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label className="label">Full Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required className="input" placeholder="Your name" />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 text-base">
                {loading ? <><Loader2 size={16} className="animate-spin" />Creating...</> : 'Create Account'}
              </button>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>}
            </form>
            <p className="text-xs text-gray-500 mt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-[#F97316] font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

