'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { Loader2, Upload, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import Image from 'next/image'

type Order = {
  id: string
  product_name: string
  status: 'pending' | 'approved' | 'declined' | 'shipped' | 'delivered'
  created_at: string
  proof_of_payment_url?: string
  payment_note?: string
  payment_method?: string
  custom_details?: string
}

type PaymentOption = {
  id: string
  type: string
  name: string
  logo_url: string
  account_number: string
  is_active: boolean
  sort_order: number
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-gray-100 text-gray-700',
}

export default function PaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null) // order id being uploaded
  const [proofFiles, setProofFiles] = useState<Record<string, File>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [messages, setMessages] = useState<Record<string, { type: 'success' | 'error'; text: string }>>({})

  const loadData = async () => {
    setLoading(true)
    try {
      const [ordersRes, optionsRes] = await Promise.all([
        fetch('/api/account/orders'),
        fetch('/api/payment-options'),
      ])
      if (ordersRes.ok) setOrders(await ordersRes.json())
      if (optionsRes.ok) {
        const opts = await optionsRes.json()
        setPaymentOptions(opts.filter((opt: PaymentOption) => opt.is_active))
      }
    } catch (err) {
      console.error('Failed to load data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const uploadProof = async (orderId: string) => {
    const file = proofFiles[orderId]
    const note = notes[orderId] || ''
    if (!file) {
      setMessages(prev => ({ ...prev, [orderId]: { type: 'error', text: 'Please select a file' } }))
      return
    }

    setUploading(orderId)
    setMessages(prev => ({ ...prev, [orderId]: undefined }))

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME'
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'spectrumcosmo'
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)

    try {
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })
      const uploadData = await uploadRes.json()
      if (!uploadData.secure_url) throw new Error('Image upload failed')

      const updateRes = await fetch('/api/account/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          proofOfPaymentUrl: uploadData.secure_url,
          paymentNote: note,
        }),
      })
      if (!updateRes.ok) throw new Error('Failed to save proof')

      setMessages(prev => ({ ...prev, [orderId]: { type: 'success', text: 'Proof submitted! Admin will review.' } }))
      // Clear local file and note for this order
      setProofFiles(prev => { const newFiles = { ...prev }; delete newFiles[orderId]; return newFiles })
      setNotes(prev => { const newNotes = { ...prev }; delete newNotes[orderId]; return newNotes })
      await loadData() // refresh orders
    } catch (err: any) {
      setMessages(prev => ({ ...prev, [orderId]: { type: 'error', text: err.message || 'Upload failed' } }))
    } finally {
      setUploading(null)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-orange-500 w-8 h-8" />
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Payments & Orders</h1>
          <p className="text-gray-500 -mt-2">Track your orders and submit payment proof</p>

          {orders.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
              No orders found.
            </div>
          ) : (
            orders.map((order) => {
              const selectedOption = paymentOptions.find(opt => opt.name === order.payment_method || opt.type === order.payment_method)
              const isPending = order.status === 'pending'
              const hasProof = !!order.proof_of_payment_url

              return (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b bg-gray-50/30 flex flex-wrap justify-between items-start gap-2">
                    <div>
                      <p className="font-semibold text-gray-900">{order.product_name}</p>
                      <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[order.status]}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    {order.custom_details && (
                      <p className="text-sm text-gray-600">{order.custom_details}</p>
                    )}

                    {/* Payment Instructions (only for pending orders without proof) */}
                    {isPending && !hasProof && selectedOption && (
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                        <div className="flex items-start gap-3">
                          {selectedOption.logo_url && (
                            <div className="w-10 h-10 relative flex-shrink-0">
                              <Image src={selectedOption.logo_url} alt={selectedOption.name} width={40} height={40} className="object-contain" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-amber-800">Payment Instructions</p>
                            <p className="text-sm text-amber-700 mt-1">
                              Send the exact amount to: 
                              {selectedOption.type === 'mobile_money' && (
                                <span className="font-mono ml-1">{selectedOption.account_number}</span>
                              )}
                              {selectedOption.type === 'bank' && (
                                <span className="font-mono ml-1">{selectedOption.account_number}</span>
                              )}
                            </p>
                            <p className="text-xs text-amber-600 mt-1">After payment, upload proof below.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Upload section (only if pending and no proof yet) */}
                    {isPending && !hasProof && (
                      <div className="border-t pt-4 space-y-3">
                        <label className="block text-sm font-medium text-gray-700">Upload Payment Proof</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) setProofFiles(prev => ({ ...prev, [order.id]: file }))
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                        />
                        <textarea
                          placeholder="Optional note (e.g., transaction reference)"
                          value={notes[order.id] || ''}
                          onChange={(e) => setNotes(prev => ({ ...prev, [order.id]: e.target.value }))}
                          rows={2}
                          className="w-full border border-gray-200 rounded-xl p-2 text-sm"
                        />
                        {messages[order.id] && (
                          <div className={`p-2 rounded-lg text-sm ${messages[order.id].type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {messages[order.id].text}
                          </div>
                        )}
                        <button
                          onClick={() => uploadProof(order.id)}
                          disabled={uploading === order.id}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50"
                        >
                          {uploading === order.id ? <Loader2 className="animate-spin w-4 h-4" /> : <Upload size={16} />}
                          {uploading === order.id ? 'Uploading...' : 'Submit Proof'}
                        </button>
                      </div>
                    )}

                    {/* Show existing proof */}
                    {hasProof && (
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-sm font-medium text-gray-700">Submitted proof:</p>
                        <a href={order.proof_of_payment_url} target="_blank" rel="noopener noreferrer" className="text-orange-500 text-sm underline break-all">
                          View image
                        </a>
                        {order.payment_note && <p className="text-xs text-gray-500 mt-1">Note: {order.payment_note}</p>}
                      </div>
                    )}

                    {/* Simple tracking timeline */}
                    <div className="border-t pt-4">
                      <p className="font-semibold text-sm mb-3">Tracking</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <p className="text-xs">Order placed</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${hasProof ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <p className="text-xs">Proof submitted {hasProof ? '✓' : ''}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${order.status === 'approved' ? 'bg-green-500' : order.status === 'declined' ? 'bg-red-500' : 'bg-gray-300'}`} />
                          <p className="text-xs">
                            {order.status === 'approved' ? 'Payment approved' : order.status === 'declined' ? 'Payment rejected' : 'Waiting for admin approval'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payment method info */}
                    {order.payment_method && (
                      <p className="text-xs text-gray-500 border-t pt-3">Method: {order.payment_method}</p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
