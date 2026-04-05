'use client'
import { useState } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
export default function OrderForm({ productName }: { productName: string }) {
  const [form, setForm] = useState({ customer_name:'', phone_number:'', custom_details:'' })
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')
  const [error, setError] = useState('')
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/orders', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({...form, product_name:productName}) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error||'Failed') }
      setStatus('success')
      setForm({ customer_name:'', phone_number:'', custom_details:'' })
    } catch(err:any) { setError(err.message); setStatus('error') }
  }
  if (status==='success') return (
    <div className="flex flex-col items-center text-center py-6 gap-3">
      <CheckCircle className="text-green-500" size={48} />
      <h3 className="font-bold text-[#111111] text-lg">Order Placed!</h3>
      <p className="text-gray-500 text-sm">Thank you! We received your order for <strong>{productName}</strong>. We'll be in touch via phone soon.</p>
      <button onClick={() => setStatus('idle')} className="btn-secondary text-sm mt-2">Place Another Order</button>
    </div>
  )
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="label">Your Name *</label><input name="customer_name" value={form.customer_name} onChange={e=>setForm(p=>({...p,customer_name:e.target.value}))} placeholder="Jane Doe" required className="input" /></div>
      <div><label className="label">Phone Number *</label><input name="phone_number" value={form.phone_number} onChange={e=>setForm(p=>({...p,phone_number:e.target.value}))} placeholder="+1 (555) 000-0000" required className="input" /></div>
      <div><label className="label">Selected Product</label><input value={productName} readOnly className="input bg-gray-50 text-gray-500 cursor-not-allowed" /></div>
      <div><label className="label">Custom Instructions</label><textarea name="custom_details" value={form.custom_details} onChange={e=>setForm(p=>({...p,custom_details:e.target.value}))} placeholder="Size, color preference, special requests..." rows={3} className="input resize-none" /></div>
      {status==='error' && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
      <button type="submit" disabled={status==='loading'} className="btn-primary w-full justify-center">
        {status==='loading' ? <><Loader2 size={16} className="animate-spin" />Placing Order...</> : 'Place Order'}
      </button>
    </form>
  )
}
