'use client'
import { useState } from 'react'
import { ShoppingBag, Loader2, Eye, EyeOff } from 'lucide-react'

export default function AdminLoginPage() {
  const [form, setForm] = useState({ username:'', password:'' })
  const [showPw, setShowPw] = useState(false)
  const [status, setStatus] = useState<'idle'|'loading'|'error'>('idle')
  const [error, setError] = useState('')

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
    <div className="min-h-screen bg-[#111111] flex items-center justify-center px-4">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(circle, #F97316 1px, transparent 1px)',backgroundSize:'32px 32px'}} />
      </div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#F97316] rounded-xl flex items-center justify-center"><ShoppingBag size={20} className="text-white" /></div>
            <span className="text-2xl font-bold text-white" style={{fontFamily:'var(--font-display)'}}>SpectrumCosmo</span>
          </div>
          <p className="text-gray-400 text-sm">Admin Dashboard</p>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-[#111111] mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm mb-8">Sign in to manage your store</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div><label className="label">Username</label><input value={form.username} onChange={e=>setForm(p=>({...p,username:e.target.value}))} placeholder="admin" required className="input" autoComplete="username" /></div>
            <div><label className="label">Password</label>
              <div className="relative">
                <input type={showPw?'text':'password'} value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} placeholder="••••••••" required className="input pr-12" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw?<EyeOff size={18}/>:<Eye size={18}/>}
                </button>
              </div>
            </div>
            {status==='error' && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">{error}</div>}
            <button type="submit" disabled={status==='loading'} className="btn-primary w-full justify-center py-3.5 text-base">
              {status==='loading'?<><Loader2 size={16} className="animate-spin"/>Signing in...</>:'Sign In'}
            </button>
          </form>
        </div>
        <p className="text-center text-gray-600 text-xs mt-6"><a href="/" className="hover:text-[#F97316]">← Back to storefront</a></p>
      </div>
    </div>
  )
}
