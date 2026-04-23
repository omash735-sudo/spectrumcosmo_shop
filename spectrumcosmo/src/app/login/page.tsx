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

  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (paused) return

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length)
    }, 4500)

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
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0B0B0B] relative overflow-hidden">

      <div className="absolute inset-0">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-orange-400/30 rounded-full animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${6 + Math.random() * 6}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="w-full md:w-1/2 relative bg-black overflow-hidden">

        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-black z-10" />

        <div
          className="md:hidden w-full h-[280px] overflow-x-auto snap-x snap-mandatory flex scroll-smooth"
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setTimeout(() => setPaused(false), 2500)}
        >
          {slides.map((slide, i) => (
            <div key={i} className="min-w-full h-[280px] snap-center relative">
              <img src={slide.url} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20" />

              <div className="absolute bottom-5 left-5 text-white">
                <p className="text-sm font-medium">{slide.title}</p>
                <p className="text-xs text-gray-300">{slide.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="hidden md:block absolute inset-0"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              className={`absolute inset-0 transition-all duration-1000 ${
                i === index ? 'opacity-100 scale-105' : 'opacity-0'
              }`}
            >
              <img src={slide.url} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30" />

              <div className="absolute bottom-10 left-10 text-white max-w-md">
                <h2 className="text-2xl font-semibold">{slide.title}</h2>
                <p className="text-gray-300 text-sm mt-1">{slide.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center px-6 relative z-10">

        <div className="w-full max-w-md">

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="w-11 h-11 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                <ShoppingBag className="text-white" size={20} />
              </div>
              <span className="text-white text-2xl font-bold">
                SpectrumCosmo
              </span>
            </div>
            <p className="text-gray-400 text-sm">Welcome back</p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-2xl">

            <h1 className="text-2xl font-bold text-black">Sign in</h1>
            <p className="text-gray-500 text-sm mb-6">Continue your journey</p>

            <form onSubmit={onSubmit} className="space-y-5">

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-400 outline-none"
              />

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-400 outline-none"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">
                  {error}
                </p>
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
      </div>

      {success && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-50">
          <div className="text-center animate-pop">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
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
          50% { opacity: 0.6; }
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
