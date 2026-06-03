'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Loader2, Upload, AlertCircle, CheckCircle, Clock, 
  Truck, Package, CreditCard, Copy, Check, Eye,
  Sparkles, ArrowRight, X, Image as ImageIcon
} from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'

type Order = {
  id: string
  order_number?: string
  product_name: string
  total_amount?: number
  status: 'pending' | 'approved' | 'declined' | 'shipped' | 'delivered'
  created_at?: string
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
  account_number: string | null
  is_active: boolean
}

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-700', bg: 'bg-yellow-50' },
  approved: { label: 'Approved', icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-50' },
  declined: { label: 'Declined', icon: AlertCircle, color: 'text-red-700', bg: 'bg-red-50' },
  shipped: { label: 'Shipped', icon: Truck, color: 'text-purple-700', bg: 'bg-purple-50' },
  delivered: { label: 'Delivered', icon: Package, color: 'text-blue-700', bg: 'bg-blue-50' },
}

function formatOrderNumber(order: any): string {
  if (order.order_number && order.order_number !== 'null') {
    return order.order_number
  }
  return `#${order.id.slice(-8).toUpperCase()}`
}

function parseAmount(amount: any): number {
  if (typeof amount === 'number') return amount
  if (typeof amount === 'string') {
    const cleaned = amount.replace(/[^0-9.-]/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

export default function AccountPaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [proofFiles, setProofFiles] = useState<Record<string, File>>({})
  const [proofPreviews, setProofPreviews] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [messages, setMessages] = useState<Record<string, { type: 'success' | 'error'; text: string }>>({})
  const [copied, setCopied] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [ordersRes, optionsRes] = await Promise.all([
        fetch('/api/account/orders'),
        fetch('/api/payment-options'),
      ])
      if (ordersRes.ok) {
        const data = await ordersRes.json()
        setOrders(Array.isArray(data) ? data : [])
      }
      if (optionsRes.ok) {
        const opts = await optionsRes.json()
        setPaymentOptions(Array.isArray(opts) ? opts.filter((opt: PaymentOption) => opt.is_active) : [])
      }
    } catch (err) {
      console.error('Failed to load data', err)
      toast.error('Failed to load payment data')
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
      toast.error('Please select a file')
      return
    }

    setUploading(orderId)
    setMessages(prev => ({ ...prev, [orderId]: undefined }))

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dfsvnaslv'
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'spectrumcosmo_unsigned_upload'
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)

    try {
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })
      const uploadData = await uploadRes.json()
      if (!uploadData.secure_url) throw new Error('Upload failed')

      const updateRes = await fetch('/api/account/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderId,
          proofOfPaymentUrl: uploadData.secure_url,
          paymentNote: note,
          transactionReference: '',
        }),
      })
      if (!updateRes.ok) throw new Error('Failed to save proof')

      toast.success('Payment proof submitted! Admin will review shortly.')
      setMessages(prev => ({ ...prev, [orderId]: { type: 'success', text: 'Proof submitted! Admin will review.' } }))
      setProofFiles(prev => { const newFiles = { ...prev }; delete newFiles[orderId]; return newFiles })
      setProofPreviews(prev => { const newPreviews = { ...prev }; delete newPreviews[orderId]; return newPreviews })
      setNotes(prev => { const newNotes = { ...prev }; delete newNotes[orderId]; return newNotes })
      await loadData()
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
      setMessages(prev => ({ ...prev, [orderId]: { type: 'error', text: err.message || 'Upload failed' } }))
    } finally {
      setUploading(null)
    }
  }

  const handleFileSelect = (orderId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }
    setProofFiles(prev => ({ ...prev, [orderId]: file }))
    const preview = URL.createObjectURL(file)
    setProofPreviews(prev => ({ ...prev, [orderId]: preview }))
  }

  const removeFile = (orderId: string) => {
    setProofFiles(prev => { const newFiles = { ...prev }; delete newFiles[orderId]; return newFiles })
    if (proofPreviews[orderId]) {
      URL.revokeObjectURL(proofPreviews[orderId])
      setProofPreviews(prev => { const newPreviews = { ...prev }; delete newPreviews[orderId]; return newPreviews })
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-7 bg-gradient-to-t from-orange-500 to-orange-600 rounded-full"></div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Payments & Orders</h1>
          <Sparkles size={18} className="text-orange-400" />
        </div>
        <p className="text-gray-500 text-sm">Track your orders and submit payment proof</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Package size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500 mb-6">You haven't placed any orders yet</p>
          <Link href="/products" className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600 transition">
            Start Shopping <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const selectedOption = paymentOptions.find(
              opt => opt.name === order.payment_method || opt.type === order.payment_method
            )
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
            const StatusIcon = statusConfig.icon
            const isPending = order.status === 'pending'
            const hasProof = !!order.proof_of_payment_url
            const orderDisplayNumber = formatOrderNumber(order)
            const totalAmount = parseAmount(order.total_amount)

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-mono font-medium text-gray-900">{orderDisplayNumber}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <Clock size={12} />
                        <span>{order.created_at ? new Date(order.created_at).toLocaleString() : 'Unknown date'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        <StatusIcon size={12} />
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-5">
                  {/* Product Info */}
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{order.product_name}</p>
                    {totalAmount > 0 && (
                      <p className="text-orange-600 font-bold text-xl mt-1">MWK {totalAmount.toLocaleString()}</p>
                    )}
                    {order.custom_details && <p className="text-sm text-gray-500 mt-2">{order.custom_details}</p>}
                  </div>

                  {/* Payment Instructions */}
                  {isPending && !hasProof && selectedOption && selectedOption.account_number && (
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
                      <div className="flex items-start gap-4">
                        {selectedOption.logo_url && (
                          <div className="w-12 h-12 relative flex-shrink-0 bg-white rounded-xl p-2 shadow-sm">
                            <Image src={selectedOption.logo_url} alt={selectedOption.name} width={40} height={40} className="object-contain" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-amber-800">Payment Instructions</p>
                          <div className="mt-2 p-2 bg-white/50 rounded-lg">
                            <p className="text-sm text-amber-700">
                              Send the exact amount to:
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="text-lg font-mono font-bold text-amber-800">{selectedOption.account_number}</code>
                              <button
                                onClick={() => copyToClipboard(selectedOption.account_number!, order.id)}
                                className="p-1 hover:bg-amber-100 rounded transition"
                              >
                                {copied === order.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-amber-600" />}
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-amber-600 mt-2">After payment, upload proof below for verification.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upload Proof Section */}
                  {isPending && !hasProof && (
                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-3">Upload Payment Proof</label>
                      
                      {/* Drag & Drop Area */}
                      {!proofFiles[order.id] ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-orange-400 transition cursor-pointer"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault()
                            const file = e.dataTransfer.files[0]
                            if (file) handleFileSelect(order.id, file)
                          }}
                          onClick={() => document.getElementById(`file-${order.id}`)?.click()}
                        >
                          <Upload size={32} className="text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Drag & drop your receipt here, or click to browse</p>
                          <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                          <input
                            id={`file-${order.id}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleFileSelect(order.id, file)
                            }}
                          />
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            {proofPreviews[order.id] ? (
                              <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                                <img src={proofPreviews[order.id]} alt="Preview" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                <ImageIcon size={24} className="text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800 truncate">{proofFiles[order.id]?.name}</p>
                              <p className="text-xs text-gray-400">{(proofFiles[order.id]?.size / 1024).toFixed(0)} KB</p>
                            </div>
                            <button onClick={() => removeFile(order.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      )}

                      <textarea
                        placeholder="Optional note (e.g., transaction reference)"
                        value={notes[order.id] || ''}
                        onChange={(e) => setNotes(prev => ({ ...prev, [order.id]: e.target.value }))}
                        rows={2}
                        className="w-full mt-3 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />

                      {messages[order.id] && (
                        <div className={`mt-2 p-3 rounded-xl text-sm flex items-center gap-2 ${messages[order.id].type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {messages[order.id].type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                          {messages[order.id].text}
                        </div>
                      )}

                      <button
                        onClick={() => uploadProof(order.id)}
                        disabled={uploading === order.id || !proofFiles[order.id]}
                        className="w-full mt-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {uploading === order.id ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                        {uploading === order.id ? 'Submitting...' : 'Submit Payment Proof'}
                      </button>
                    </div>
                  )}

                  {/* Existing Proof */}
                  {hasProof && (
                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={16} className="text-green-600" />
                        <p className="font-medium text-green-800">Payment Proof Submitted</p>
                      </div>
                      <button
                        onClick={() => window.open(order.proof_of_payment_url, '_blank')}
                        className="text-orange-600 hover:text-orange-700 text-sm underline flex items-center gap-1"
                      >
                        <Eye size={14} /> View uploaded proof
                      </button>
                      {order.payment_note && <p className="text-xs text-green-600 mt-2">Note: {order.payment_note}</p>}
                    </div>
                  )}

                  {/* Tracking Timeline */}
                  <div className="border-t pt-4">
                    <p className="font-semibold text-sm mb-4 text-gray-800">Order Progress</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${true ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <p className="text-xs text-gray-600">Order placed</p>
                        <span className="text-xs text-gray-400 ml-auto">{order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${hasProof ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <p className="text-xs text-gray-600">Payment proof submitted</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${order.status === 'approved' ? 'bg-green-500' : order.status === 'declined' ? 'bg-red-500' : 'bg-gray-300'}`} />
                        <p className="text-xs text-gray-600">
                          {order.status === 'approved' ? 'Payment approved ✓' : order.status === 'declined' ? 'Payment rejected ✗' : 'Awaiting admin approval'}
                        </p>
                      </div>
                      {(order.status === 'shipped' || order.status === 'delivered') && (
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <p className="text-xs text-gray-600">{order.status === 'shipped' ? 'Order shipped' : 'Order delivered'}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Method Footer */}
                  {order.payment_method && (
                    <p className="text-xs text-gray-400 border-t pt-3 flex items-center gap-1">
                      <CreditCard size={12} /> Payment: {order.payment_method}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
