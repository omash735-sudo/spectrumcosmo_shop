'use client'
import { useState } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import StarRating from '@/components/ui/StarRating'
export default function ReviewSubmitForm() {
  const [form, setForm] = useState({ customer_name:'', review_text:'', rating:0, image_url:'' })
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')
  const [error, setError] = useState('')
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.rating===0) { setError('Please select a star rating.'); return }
    setStatus('loading')
    try {
      const res = await fetch('/api/reviews', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error||'Failed') }
      setStatus('success')
    } catch(err:any) { setError(err.message); setStatus('error') }
  }
  if (status==='success') return (
    <div className="flex flex-col items-center text-center py-8 gap-4">
      <CheckCircle className="text-green-500" size={56} />
      <h2 className="font-bold text-[#111111] text-2xl">Thank You!</h2>
      <p className="text-gray-500 max-w-sm">Your review is pending approval and will appear on our site once approved.</p>
      <a href="/" className="btn-primary mt-2">Back to Home</a>
    </div>
  )
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div><label className="label">Your Name *</label><input value={form.customer_name} onChange={e=>setForm(p=>({...p,customer_name:e.target.value}))} required placeholder="Jane Doe" className="input" /></div>
      <div><label className="label">Your Rating *</label><div className="mt-1"><StarRating rating={form.rating} interactive onRate={r=>setForm(p=>({...p,rating:r}))} size={28} /></div></div>
      <div><label className="label">Your Review *</label><textarea value={form.review_text} onChange={e=>setForm(p=>({...p,review_text:e.target.value}))} required rows={4} placeholder="Tell us about your experience..." className="input resize-none" /></div>
      <div><label className="label">Your Photo URL <span className="text-gray-400 font-normal">(optional)</span></label><input value={form.image_url} onChange={e=>setForm(p=>({...p,image_url:e.target.value}))} placeholder="https://..." className="input" type="url" /></div>
      {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
      <button type="submit" disabled={status==='loading'} className="btn-primary w-full justify-center text-base py-3.5">
        {status==='loading' ? <><Loader2 size={16} className="animate-spin" />Submitting...</> : 'Submit Review'}
      </button>
    </form>
  )
}
