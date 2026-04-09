'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { Loader2 } from 'lucide-react'

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
}

export default function AccountPage() {
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [proofLoadingId, setProofLoadingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('all')
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadMessage, setUploadMessage] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', newsletterSubscribed: true })
  const [proof, setProof] = useState<Record<string, { url: string; note: string }>>({})

  const load = async () => {
    setLoading(true)
    const me = await fetch('/api/auth/me')
    if (!me.ok) {
      window.location.href = '/login'
      return
    }
    const meData = await me.json()
    setUser(meData.user)
    setForm({
      name: meData.user?.name || '',
      phone: meData.user?.phone || '',
      newsletterSubscribed: Boolean(meData.user?.newsletter_subscribed ?? true),
    })

    const orderRes = await fetch('/api/account/orders')
    setOrders(orderRes.ok ? await orderRes.json() : [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    await load()
    setSaving(false)
  }

  const submitProof = async (orderId: string) => {
    const row = proof[orderId]
    if (!row?.url) return
    setProofLoadingId(orderId)
    await fetch('/api/account/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, proofOfPaymentUrl: row.url, paymentNote: row.note }),
    })
    await load()
    setProofLoadingId(null)
  }

  const uploadProofFile = async (orderId: string, file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
    if (!cloudName || !preset) {
      setUploadMessage('Missing Cloudinary config. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', preset)
    setUploadingId(orderId)
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    })
    setUploadingId(null)
    if (!res.ok) {
      setUploadMessage('File upload failed. You can still paste a payment-proof URL manually.')
      return
    }
    const data = await res.json()
    setProof((p) => ({ ...p, [orderId]: { url: data.secure_url || '', note: p[orderId]?.note || '' } }))
    setUploadMessage('Proof image uploaded. Click "Upload Proof" to submit it with your order.')
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-[#F97316]" />
        </main>
        <Footer />
      </>
    )
  }

  const visibleOrders = orders.filter((o) => (filter === 'all' ? true : o.status === filter))

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-3 gap-6">
          <section className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-6 h-fit">
            <h1 className="text-2xl font-bold text-[#111111] mb-1">My Account</h1>
            <p className="text-sm text-gray-500 mb-6">Manage profile and preferences</p>
            <form onSubmit={saveProfile} className="space-y-4">
              <div><label className="label">Name</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><label className="label">Email</label><input className="input bg-gray-50" value={user.email} readOnly /></div>
              <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.newsletterSubscribed}
                  onChange={e => setForm(p => ({ ...p, newsletterSubscribed: e.target.checked }))}
                />
                Receive newsletter updates
              </label>
              <button className="btn-primary w-full justify-center" disabled={saving}>
                {saving ? <><Loader2 size={16} className="animate-spin" />Saving...</> : 'Save Profile'}
              </button>
            </form>
          </section>

          <section className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-[#111111]">My Orders</h2>
              <p className="text-xs text-gray-500 mt-1">Track status and upload payment proof</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {(['all', 'pending', 'approved', 'declined'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === f ? 'bg-[#F97316] text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {visibleOrders.length === 0 ? (
              <div className="p-8 text-sm text-gray-500">You have no orders yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {visibleOrders.map((o) => (
                  <div key={o.id} className="p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <div>
                        <p className="font-semibold text-[#111111]">{o.product_name}</p>
                        <p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString()}</p>
                      </div>
                      <span className={`badge ${STATUS_STYLE[o.status] || 'bg-gray-100 text-gray-700'}`}>{o.status}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{o.custom_details || 'No custom details.'}</p>
                    {o.total_price_usd && (
                      <p className="text-xs text-gray-500 mb-3">
                        Quantity: {o.quantity || 1} · Total (USD): ${Number(o.total_price_usd).toFixed(2)}
                      </p>
                    )}
                    {o.proof_of_payment_url ? (
                      <a href={o.proof_of_payment_url} target="_blank" className="text-sm text-[#F97316] hover:underline">
                        View uploaded payment proof
                      </a>
                    ) : (
                      <div className="grid md:grid-cols-[1fr_auto] gap-2">
                        <div className="space-y-2">
                          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                            <p className="text-xs text-gray-600 mb-2">
                              Choose from gallery/files on mobile or PC. Browser/OS controls permission prompts (Allow once / Allow always).
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <label className="btn-secondary cursor-pointer">
                                Choose File
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) uploadProofFile(o.id, file)
                                  }}
                                />
                              </label>
                              <label className="btn-secondary cursor-pointer">
                                Use Camera
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) uploadProofFile(o.id, file)
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                          <input
                            className="input"
                            placeholder="Proof of payment URL"
                            value={proof[o.id]?.url || ''}
                            onChange={(e) =>
                              setProof((p) => ({ ...p, [o.id]: { url: e.target.value, note: p[o.id]?.note || '' } }))
                            }
                          />
                          <input
                            className="input"
                            placeholder="Payment note (optional)"
                            value={proof[o.id]?.note || ''}
                            onChange={(e) =>
                              setProof((p) => ({ ...p, [o.id]: { url: p[o.id]?.url || '', note: e.target.value } }))
                            }
                          />
                        </div>
                        <button className="btn-secondary h-fit" onClick={() => submitProof(o.id)} disabled={proofLoadingId === o.id}>
                          {proofLoadingId === o.id || uploadingId === o.id ? <><Loader2 size={14} className="animate-spin" />Submitting</> : 'Upload Proof'}
                        </button>
                      </div>
                    )}
                    {uploadMessage && <p className="text-xs text-gray-600 mt-2">{uploadMessage}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}

