'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, ShoppingBag, Check, Home } from 'lucide-react'

const slides = [
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776969177/WhatsApp_Image_2026-04-23_at_20.31.09_unga3v.jpg',
    title: 'Enter the Cosmo Realm',
    subtitle: 'Where style becomes identity',
  },
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776969160/WhatsApp_Image_2026-04-23_at_20.31.08_bv77wh.jpg',
    title: 'Neon Street Energy',
    subtitle: 'Streetwear meets digital culture',
  },
  {
    url: 'https://res.cloudinary.com/dfsvnaslv/image/upload/v1776969140/kkkk_a1elqx.jpg',
    title: 'Unlock Your Style Mode',
    subtitle: 'Step into the anime universe',
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
    }, 5200)

    return () => clearInterval(interval)
  }, [paused])

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => setSuccess(false), 2200)
    return () => clearTimeout(t)
  }, [success])

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

      {/* NEON BACKGROUND LAYERS */}
      <div className="absolute inset-0">
        {slides.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img src={s.url} className="w-full h-full object-cover scale-110" />
          </div>
        ))}
      </div>

      {/* CYBER GLOW OVERLAY */}
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-black/50 to-cyan-900/30" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      {/* ENERGY PARTICLES */}
      <div className="absolute inset-0">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-300/30 rounded-full animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${6 + Math.random() * 6}s`,
            }}
          />
        ))}
      </div>

      {/* HOME BUBBLE */}
      <div className="fixed bottom-5 right-5 z-50">
        <button
          onClick={() => router.push('/')}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white"
        >
          <Home size={18} />
        </button>
      </div>

      {/* CENTER */}
      <div
        className="relative min-h-screen flex items-center justify-center px-6"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >

        {/* PORTAL CARD */}
        <div className="w-full max-w-md relative">

          {/* OUTER GLOW RING */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-30 blur-xl animate-pulse" />

          {/* INNER CARD */}
          <div className="relative bg-black/40 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-2xl">

            {/* BRAND */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-3 mb-3">
                <div className="w-11 h-11 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="text-white" size={20} />
                </div>
                <span className="text-white text-2xl font-semibold tracking-wide">
                  SpectrumCosmo
                </span>
              </div>

              <p className="text-gray-300 text-sm">
                Enter the anime portal
              </p>
            </div>

            {/* SLIDE TEXT */}
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
                className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20 focus:ring-2 focus:ring-cyan-400 outline-none"
              />

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 text-white border border-white/20 focus:ring-2 focus:ring-cyan-400 outline-none"
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
                className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:scale-[1.02] transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Entering...
                  </>
                ) : (
                  'Enter Portal'
                )}
              </button>

            </form>

          </div>
        </div>
      </div>

      {/* SUCCESS TOAST */}
      {success && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/20">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
            <span className="text-white text-sm">
              Portal opened successfully
            </span>
          </div>
        </div>
      )}

      {/* ANIMATIONS */}
      <style jsx>{`
        .animate-float {
          position: absolute;
          animation: float linear infinite;
        }

        @keyframes float {
          0% { transform: translateY(0); opacity: 0.2; }
          100% { transform: translateY(-100vh); opacity: 0.2; }
        }
      `}</style>

    </div>
  )
}
