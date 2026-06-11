'use client'
import { useState } from 'react'
import { Loader2, Eye, EyeOff, Sparkles } from 'lucide-react'

export default function AdminLoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [status, setStatus] = useState<'idle'|'loading'|'error'>('idle')
  const [error, setError] = useState('')

  // Logo for admin (dark mode compatible - white/orange)
  const logoSrc = "https://res.cloudinary.com/dfsvnaslv/image/upload/v1777984813/1002913281-removebg-preview_jblapw.png"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    const res = await fetch('/api/admin/auth', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(form),
      credentials: 'include'
    })
    if (res.ok) { 
      window.location.href = '/admin/dashboard'
    }
    else { 
      const d = await res.json()
      setError(d.error || 'Login failed')
      setStatus('error') 
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 dark:bg-gray-950 flex items-center justify-center px-3 sm:px-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(circle, #F97316 1px, transparent 1px)',backgroundSize:'32px 32px'}} />
      </div>
      
      <div className="relative w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <img src={logoSrc} alt="SpectrumCosmo" className="h-10 sm:h-12 w-auto" />
          </div>
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-orange-500/20 px-2.5 sm:px-3 py-1 rounded-full mb-2">
            <Sparkles size={12} className="text-orange-400" />
            <span className="text-[10px] sm:text-xs font-medium text-orange-400">Admin Portal</span>
          </div>
          <p className="text-gray-400 text-xs sm:text-sm">Secure access to your dashboard</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 shadow-2xl">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">Welcome back</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-6 sm:mb-8">Sign in to manage your store</p>
          
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Username Field */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                Username
              </label>
              <input 
                value={form.username} 
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))} 
                placeholder="admin" 
                required 
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                autoComplete="username"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                Password
              </label>
              <div className="relative">
                <input 
                  type={showPw ? 'text' : 'password'} 
                  value={form.password} 
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} 
                  placeholder="••••••••" 
                  required 
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition pr-10 sm:pr-12"
                  autoComplete="current-password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPw(!showPw)} 
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                >
                  {showPw ? <EyeOff size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Eye size={16} className="sm:w-[18px] sm:h-[18px]" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {status === 'error' && (
              <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs sm:text-sm px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-red-100 dark:border-red-800">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={status === 'loading'} 
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2.5 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Back Link */}
        <p className="text-center text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs mt-5 sm:mt-6">
          <a href="/" className="hover:text-orange-500 dark:hover:text-orange-400 transition">
            ← Back to storefront
          </a>
        </p>
      </div>
    </div>
  )
}
