'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Check, Shield } from 'lucide-react'

const mobileSlides = [
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776964570/WhatsApp_Image_2026-04-23_at_18.37.58_ihjqbi.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776964617/WhatsApp_Image_2026-04-23_at_18.37.56_ztrygu.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776964638/WhatsApp_Image_2026-04-23_at_18.37.55_llcwfg.jpg'
]

const desktopSlides = [
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776969177/WhatsApp_Image_2026-04-23_at_20.31.09_unga3v.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776969160/WhatsApp_Image_2026-04-23_at_20.31.08_bv77wh.jpg',
  'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776969140/kkkk_a1elqx.jpg'
]

export default function LoginPage() {
  const router = useRouter()
  const [isDesktop, setIsDesktop] = useState(false)
  const [index, setIndex] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isTestAccount, setIsTestAccount] = useState(false)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const activeSlides = isDesktop ? desktopSlides : mobileSlides

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((p) => (p + 1) % activeSlides.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [activeSlides.length])

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(false), 2000)
    return () => clearTimeout(t)
  }, [success])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setIsTestAccount(false)
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }
      
      // After successful login, check if user is test account
      if (data.user?.is_test_account) {
        setIsTestAccount(true)
      }
      
      setSuccess(true)
      setTimeout(() => router.push('/account'), 1200)
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  const logoSrc = "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png"

  return (
    <>
      {/* Test Account Banner */}
      {isTestAccount && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-100 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800">
          <Shield size={14} className="inline mr-1" />
          You are in read‑only demo mode. Write actions (orders, reviews, etc.) are disabled.
        </div>
      )}
      
      <div className="min-h-screen relative overflow-hidden bg-black">
        {activeSlides.map((img, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === index ? 'opacity-100' : 'opacity-0'}`}
          >
            <div className="absolute inset-0 bg-center bg-cover scale-105" style={{ backgroundImage: `url(${img})` }} />
          </div>
        ))}
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/70 to-orange-900/30" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />

        <div className="relative min-h-screen flex items-center justify-center px-6 z-10">
          <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
            <div className="text-center mb-6">
              <img src={logoSrc} alt="SpectrumCosmo" className="h-12 mx-auto mb-4" />
              <h2 className="text-white text-xl font-semibold">Welcome Back</h2>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex justify-between text-sm">
                <Link href="/forgot-password" className="text-gray-300 hover:text-white transition">
                  Forgot password?
                </Link>
                <Link href="/signup" className="text-orange-400 hover:text-orange-300 transition">
                  Create account
                </Link>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-600 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        {success && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/20">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Check size={14} className="text-white" />
              </div>
              <span className="text-white text-sm">Login successful</span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
