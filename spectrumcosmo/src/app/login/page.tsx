'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, ShoppingBag, Check } from 'lucide-react'

const slides = [
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776964570/WhatsApp_Image_2026-04-23_at_18.37.58_ihjqbi.jpg',
    title: 'Wear your excitement with pride',
    subtitle: 'Premium anime streetwear experience',
  },
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776964617/WhatsApp_Image_2026-04-23_at_18.37.56_ztrygu.jpg',
    title: 'Express your identity',
    subtitle: 'Every piece tells a story',
  },
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776964638/WhatsApp_Image_2026-04-23_at_18.37.55_llcwfg.jpg',
    title: 'Level up your style',
    subtitle: 'Designed for real culture',
  },
]

export default function LoginPage() {
  const router = useRouter()

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (paused) return

    const interval = setInterval(() => {
      setIndex((p) => (p + 1) % slides.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [paused])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      setSuccess(true)

      setTimeout(() => {
        router.push('/account')
      }, 1200)

    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">

      {/* BACKGROUND SLIDESHOW */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={slide.url}
            className="w-full h-full object-cover scale-105"
          />
        </div>
      ))}

      {/* BLEND LAYERS (this is the cinematic feel) */}
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black/40 to-black/80" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      {/* PARTICLES */}
      <div className="absolute inset-0">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-orange-400/20 rounded-full animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${6 + Math.random() * 6}s`,
            }}
          />
        ))}
      </div>

      {/* CONTENT CENTER */}
      <div className="relative min-h-screen flex items-center justify-center px-6">

        {/* GLASS CARD */}
        <div
          className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setTimeout(() => setPaused(false), 2000)}
        >

          {/* BRAND */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center">
                <ShoppingBag className="text-white" size={20} />
              </div>
              <span className="text-white text-2xl font-bold">
                SpectrumCosmo
              </span>
            </div>
            <p className="text-gray-300 text-sm">Welcome back</p>
          </div>

          {/* SLIDE CAPTION */}
          <div className="text-center mb-6">
            <h2 className="text-white text-lg font-semibold">
              {slides[index].title}
            </h2>
            <p className="text-gray-300 text-xs mt-1">
              {slides[index].subtitle}
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={onSubmit} className="space-y-4">

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button
              disabled={loading}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

        </div>
      </div>

      {/* SUCCESS */}
      {success && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="text-center animate-pop">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={36} className="text-white" />
            </div>
            <h2 className="text-white text-xl font-semibold">
              Login Successful
            </h2>
          </div>
        </div>
      )}

      <style jsx>{`
        .animate-float {
          position: absolute;
          animation: float linear infinite;
        }

        @keyframes float {
          0% { transform: translateY(0); opacity: 0.2; }
          100% { transform: translateY(-100vh); opacity: 0.2; }
        }

        .animate-pop {
          animation: pop 0.4s ease-out;
        }

        @keyframes pop {
          0% { transform: scale(0.7); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

    </div>
  )
}
