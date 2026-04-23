'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, ShoppingBag, Check } from 'lucide-react'

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

  const [stage, setStage] = useState<'intro' | 'form'>('intro')
  const [index, setIndex] = useState(0)

  const [isDesktop, setIsDesktop] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

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

  const startLogin = () => {
    setStage('form')
  }

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
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">

      {/* BACKGROUND */}
      {activeSlides.map((img, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className="absolute inset-0 bg-center bg-cover scale-105"
            style={{ backgroundImage: `url(${img})` }}
          />
        </div>
      ))}

      {/* CINEMATIC OVERLAY (SPECTRUM ORANGE TONE) */}
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black/70 to-orange-900/30" />
      <div className="absolute inset-0 backdrop-blur-[2px]" />

      {/* INTRO SCREEN */}
      {stage === 'intro' && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="text-center animate-fadeIn">

            <div className="w-14 h-14 mx-auto mb-4 bg-orange-500 rounded-xl flex items-center justify-center">
              <ShoppingBag className="text-white" />
            </div>

            <h1 className="text-white text-2xl font-semibold mb-2">
              Welcome Back
            </h1>

            <p className="text-gray-300 text-sm mb-6">
              SpectrumCosmo Portal
            </p>

            <button
              onClick={startLogin}
              className="px-6 py-2 bg-orange-500 text-white rounded-xl"
            >
              Enter
            </button>
          </div>
        </div>
      )}

      {/* LOGIN FORM */}
      {stage === 'form' && (
        <div className="relative min-h-screen flex items-center justify-center px-6 z-10">

          <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/20 rounded-3xl p-8">

            <div className="text-center mb-6">
              <div className="w-11 h-11 mx-auto mb-3 bg-orange-500 rounded-xl flex items-center justify-center">
                <ShoppingBag className="text-white" />
              </div>

              <h2 className="text-white text-xl font-semibold">
                SpectrumCosmo
              </h2>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/10 text-white border border-white/20"
              />

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 text-white border border-white/20"
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
                className="w-full bg-orange-500 text-white py-3 rounded-xl flex items-center justify-center gap-2"
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
      )}

      {/* SUCCESS */}
      {success && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/20">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
            <span className="text-white text-sm">
              Login successful
            </span>
          </div>
        </div>
      )}

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

    </div>
  )
}
