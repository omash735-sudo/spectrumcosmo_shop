'use client'

import { useEffect, useState } from 'react'
import { Loader2, CreditCard, Upload, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import Image from 'next/image'

// ---------- TYPES ----------
type Order = {
  id: string
  name?: string
  phone?: string
  location?: string
  amount: number
  status: 'pending' | 'paid' | 'failed' | 'approved'
  payment_method: string
  created_at: string
  tx_ref?: string
  proof_of_payment_url?: string
  payment_note?: string
}

type PaymentOption = {
  id: string
  type: string
  name: string
  logo_url: string
  account_number: string | null  // for bank/ mobile money agent code
  is_active: boolean
  sort_order: number
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  approved: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
}

export default function AccountPaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Order | null>(null)
  const [uploading, setUploading] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [paymentNote, setPaymentNote] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load orders and payment options
  const loadData = async () => {
    setLoading(true)
    try {
      const [ordersRes, optionsRes] = await Promise.all([
        fetch('/api/orders/list'),
        fetch('/api/payment-options')
      ])
      if (ordersRes.ok) setOrders(await ordersRes.json())
      if (optionsRes.ok) setPaymentOptions(await optionsRes.json())
    } catch (err) {
      console.error('Failed to load data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Upload proof for selected order
  const uploadProof = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || !proofFile) {
      setMessage({ type: 'error', text: 'Please select a file' })
      return
    }
    setUploading(true)
    setMessage(null)

    // 1. Upload image to Cloudinary (or your own endpoint)
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME'
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'spectrumcosmo'
    const formData = new FormData()
    formData.append('file', proofFile)
    formData.append('upload_preset', uploadPreset)

    try {
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })
      const uploadData = await uploadRes.json()
      if (!uploadData.secure_url) throw new Error('Image upload failed')

      // 2. Save proof URL + note to order
      const updateRes = await fetch(`/api/account/orders`, {   // reuse your existing PATCH
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selected.id,
          proofOfPaymentUrl: uploadData.secure_url,
          paymentNote,
        }),
      })
      if (!updateRes.ok) throw new Error('Failed to save payment proof')

      setMessage({ type: 'success', text: 'Payment proof submitted! Admin will review it.' })
      setProofFile(null)
      setPaymentNote('')
      // Refresh order list to reflect pending status (still pending until admin approves)
      await loadData()
      // Reselect the same order to show updated data (if still exists)
      const updatedOrder = orders.find(o => o.id === selected.id)
      if (updatedOrder) setSelected(updatedOrder)
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Upload failed' })
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500 w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Payments & Orders</h1>
        <p className="text-gray-500 mt-1">Track your order payments and submit proof</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT: ORDER LIST */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b bg-gray-50/40 flex items-center gap-2">
              <CreditCard size={18} className="text-gray-500" />
              <h2 className="font-semibold text-gray-800">Orders</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">No orders yet.</div>
              ) : (
                orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelected(order)}
                    className={`w-full text-left p-5 transition-all duration-200 ${
                      selected?.id === order.id
                        ? 'bg-orange-50/40 border-l-4 border-orange-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <p className="font-medium text-gray-900 line-clamp-1">Order #{order.id.slice(-8)}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-orange-600 font-bold mt-1">MWK {order.amount.toLocaleString()}</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[order.status]}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: DETAILS + PAYMENT INSTRUCTIONS */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            {!selected ? (
              <div className="text-center py-12 text-gray-500">Select an order to view details.</div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
                  <p className="text-sm text-gray-500 mt-1">Order ID: {selected.id}</p>
                </div>

                {/* Simple Timeline */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <p className="text-sm">Order created</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${selected.status !== 'pending' ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <p className="text-sm">Payment submitted {selected.proof_of_payment_url ? '(proof received)' : ''}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${selected.status === 'paid' || selected.status === 'approved' ? 'bg-green-500' : selected.status === 'failed' ? 'bg-red-500' : 'bg-gray-300'}`} />
                    <p className="text-sm">Payment verified</p>
                  </div>
                </div>

                {/* Payment Info & Instructions (only for pending orders) */}
                {selected.status === 'pending' && (
                  <div className="bg-amber-50 rounded-xl p-5 mb-6 border border-amber-200">
                    <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
                      <AlertCircle size={18} /> Payment Instructions
                    </h3>
                    <p className="text-sm text-amber-700 mb-4">
                      Please send the exact amount to one of the following accounts, then fill the form below with your proof.
                    </p>

                    {/* Dynamically show payment options based on selected.payment_method */}
                    {paymentOptions
                      .filter(opt => opt.is_active && (opt.name === selected.payment_method || opt.type === selected.payment_method))
                      .map(opt => (
                        <div key={opt.id} className="flex items-start gap-4 p-3 bg-white rounded-lg shadow-sm mb-3">
                          {opt.logo_url && (
                            <div className="w-12 h-12 relative flex-shrink-0">
                              <Image src={opt.logo_url} alt={opt.name} width={48} height={48} className="object-contain" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{opt.name}</p>
                            {opt.type === 'mobile_money' && (
                              <p className="text-sm text-gray-600">Agent Code: <span className="font-mono">{opt.account_number}</span></p>
                            )}
                            {opt.type === 'bank' && (
                              <p className="text-sm text-gray-600">Account: <span className="font-mono">{opt.account_number}</span></p>
                            )}
                          </div>
                        </div>
                      ))}

                    {/* Fallback if no matching option from DB */}
                    {paymentOptions.filter(opt => opt.is_active && (opt.name === selected.payment_method || opt.type === selected.payment_method)).length === 0 && (
                      <div className="text-sm text-gray-600 bg-white p-2 rounded">
                        Payment method: <strong>{selected.payment_method}</strong>. Please contact support for details.
                      </div>
                    )}
                  </div>
                )}

                {/* Proof Upload Form (only if pending and no proof yet) */}
                {selected.status === 'pending' && !selected.proof_of_payment_url && (
                  <form onSubmit={uploadProof} className="space-y-4 mt-4 border-t pt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Upload payment proof (screenshot or receipt)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                      <textarea
                        value={paymentNote}
                        onChange={(e) => setPaymentNote(e.target.value)}
                        rows={2}
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                        placeholder="e.g., Payment from John, TNM reference 12345"
                      />
                    </div>
                    {message && (
                      <div className={`p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={uploading || !proofFile}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium disabled:opacity-50"
                    >
                      {uploading ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload size={16} />}
                      {uploading ? 'Uploading...' : 'Submit Payment Proof'}
                    </button>
                  </form>
                )}

                {/* Show existing proof if already uploaded */}
                {selected.proof_of_payment_url && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm font-medium text-gray-700 mb-2">Submitted proof:</p>
                    <a href={selected.proof_of_payment_url} target="_blank" rel="noopener noreferrer" className="text-orange-500 underline break-all text-sm">
                      View image
                    </a>
                    {selected.payment_note && <p className="text-xs text-gray-500 mt-2">Note: {selected.payment_note}</p>}
                  </div>
                )}

                {/* Order details table */}
                <div className="mt-8 text-sm text-gray-600 border-t pt-4 space-y-1">
                  <p>Method: <b>{selected.payment_method}</b></p>
                  <p>Amount: <b>MWK {selected.amount.toLocaleString()}</b></p>
                  <p>Date: {new Date(selected.created_at).toLocaleString()}</p>
                  {selected.tx_ref && <p>TX Ref: {selected.tx_ref}</p>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
