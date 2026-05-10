'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setMessage('If an account exists with that email, you will receive a password reset link.')
      setEmail('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Dark mode logo for dark background
  const logoSrc = "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png"

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#111111] flex items-center justify-center px-4 py-12">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #F97316 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>
        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logoSrc} alt="SpectrumCosmo" className="h-12 mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Reset your password</p>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <h1 className="text-2xl font-bold text-[#111111] mb-2">Forgot password?</h1>
            <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
              />
              {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
              {message && <p className="text-sm text-green-600 bg-green-50 p-2 rounded">{message}</p>}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Send Reset Link'}
              </button>
              <p className="text-center text-xs text-gray-500">
                Remember your password?{' '}
                <Link href="/login" className="text-[#F97316] hover:underline">Sign in</Link>
              </p>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
