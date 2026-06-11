'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { 
  Loader2, Upload, AlertCircle, CheckCircle, Clock, 
  Truck, Package, CreditCard, Copy, Check, Eye,
  Sparkles, ArrowRight, X, Image as ImageIcon
} from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'

// Types
type OrderStatus = 'pending' | 'approved' | 'declined' | 'shipped' | 'delivered'

type Order = {
  id: string
  order_number?: string
  product_name: string
  total_amount?: number
  status: OrderStatus
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

type MessageType = {
  type: 'success' | 'error'
  text: string
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: any; color: string; bg: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/30' },
  approved: { label: 'Approved', icon: CheckCircle, color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30' },
  declined: { label: 'Declined', icon: AlertCircle, color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30' },
  shipped: { label: 'Shipped', icon: Truck, color: 'text-purple-700 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  delivered: { label: 'Delivered', icon: Package, color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
}

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dfsvnaslv'
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'spectrumcosmo_unsigned_upload'

// Helper functions
function formatOrderNumber(order: Order): string {
  if (order.order_number && order.order_number !== 'null') {
    return order.order_number
  }
  return `#${order.id.slice(-8).toUpperCase()}`
}

function parseAmount(amount: number | string | null | undefined): number {
  if (typeof amount === 'number') return amount
  if (typeof amount === 'string') {
    const cleaned = amount.replace(/[^0-9.-]/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'Unknown date'
  return new Date(dateString).toLocaleString()
}

function formatFileSize(bytes: number): string {
  return `${(bytes / 1024).toFixed(0)} KB`
}

export default function AccountPaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [paymentOptions, setPaymentOptions] = useState<PaymentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [proofFiles, setProofFiles] = useState<Record<string, File>>({})
  const [proofPreviews, setProofPreviews] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [messages, setMessages] = useState<Record<string, MessageType>>({})
  const [copied, setCopied] = useState<string | null>(null)

  const loadData = useCallback(async () => {
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
      console.error('Failed to load data:', err)
      toast.error('Failed to load payment data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    return () => {
      Object.values(proofPreviews).forEach((preview) => {
        if (preview) URL.revokeObjectURL(preview)
      })
    }
  }, [proofPreviews])

  const uploadProof = async (orderId: string) => {
    const file = proofFiles[orderId]
    const note = notes[orderId] || ''
    
    if (!file) {
      toast.error('Please select a file')
      return
    }

    setUploading(orderId)
    setMessages(prev => {
      const newMessages = { ...prev }
      delete newMessages[orderId]
      return newMessages
    })

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

    try {
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
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
      setMessages(prev => ({ 
        ...prev, 
        [orderId]: { type: 'success', text: 'Proof submitted! Admin will review.' } 
      }))
      
      setProofFiles(prev => {
        const newFiles = { ...prev }
        delete newFiles[orderId]
        return newFiles
      })
      
      if (proofPreviews[orderId]) {
        URL.revokeObjectURL(proofPreviews[orderId])
        setProofPreviews(prev => {
          const newPreviews = { ...prev }
          delete newPreviews[orderId]
          return newPreviews
        })
      }
      
      setNotes(prev => {
        const newNotes = { ...prev }
        delete newNotes[orderId]
        return newNotes
      })
      
      await loadData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed'
      toast.error(errorMessage)
      setMessages(prev => ({ 
        ...prev, 
        [orderId]: { type: 'error', text: errorMessage } 
      }))
    } finally {
      setUploading(null)
    }
  }

  const handleFileSelect = (orderId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 5MB')
      return
    }
    setProofFiles(prev => ({ ...prev, [orderId]: file }))
    const preview = URL.createObjectURL(file)
    setProofPreviews(prev => ({ ...prev, [orderId]: preview }))
  }

  const removeFile = (orderId: string) => {
    setProofFiles(prev => {
      const newFiles = { ...prev }
      delete newFiles[orderId]
      return newFiles
    })
    if (proofPreviews[orderId]) {
      URL.revokeObjectURL(proofPreviews[orderId])
      setProofPreviews(prev => {
        const newPreviews = { ...prev }
        delete newPreviews[orderId]
        return newPreviews
      })
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, orderId: string) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(orderId, file)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-orange-500 w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Loading your orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 md:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
          <div className="w-1 h-5 sm:h-7 bg-gradient-to-t from-orange-500 to-orange-600 rounded-full"></div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Payments & Orders</h1>
          <Sparkles size={14} className="text-orange-400 sm:w-[18px] sm:h-[18px]" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">Track your orders and submit payment proof</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 p-8 sm:p-12 text-center shadow-sm">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Package size={28} className="text-gray-300 dark:text-gray-500 sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">No orders found</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-5 sm:mb-6">You haven't placed any orders yet</p>
          <Link href="/products" className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-medium text-sm sm:text-base hover:bg-orange-600 transition">
            Start Shopping <ArrowRight size={14} className="sm:w-4 sm:h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
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
              <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                {/* Header */}
                <div className="p-3.5 sm:p-4 md:p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                    <div>
                      <p className="text-xs sm:text-sm font-mono font-medium text-gray-900 dark:text-white">{orderDisplayNumber}</p>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        <Clock size={10} className="sm:w-3 sm:h-3" />
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        <StatusIcon size={10} className="sm:w-3 sm:h-3" />
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-3.5 sm:p-4 md:p-5 space-y-4 sm:space-y-5">
                  {/* Product Info */}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg">{order.product_name}</p>
                    {totalAmount > 0 && (
                      <p className="text-orange-600 dark:text-orange-400 font-bold text-lg sm:text-xl mt-1">MWK {totalAmount.toLocaleString()}</p>
                    )}
                    {order.custom_details && (
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5 sm:mt-2">{order.custom_details}</p>
                    )}
                  </div>

                  {/* Payment Instructions */}
                  {isPending && !hasProof && selectedOption && selectedOption.account_number && (
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-xl p-3.5 sm:p-4 border border-amber-200 dark:border-amber-800">
                      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                        {selectedOption.logo_url && (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 relative flex-shrink-0 bg-white dark:bg-gray-800 rounded-xl p-1.5 sm:p-2 shadow-sm">
                            <Image src={selectedOption.logo_url} alt={selectedOption.name} width={40} height={40} className="object-contain" />
                          </div>
                        )}
                        <div className="flex-1 w-full">
                          <p className="font-semibold text-amber-800 dark:text-amber-400 text-sm sm:text-base">Payment Instructions</p>
                          <div className="mt-2 p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                            <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-500">
                              Send the exact amount to:
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <code className="text-sm sm:text-lg font-mono font-bold text-amber-800 dark:text-amber-400 break-all">{selectedOption.account_number}</code>
                              <button
                                onClick={() => copyToClipboard(selectedOption.account_number!, order.id)}
                                className="p-1 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded transition flex-shrink-0"
                              >
                                {copied === order.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-amber-600" />}
                              </button>
                            </div>
                          </div>
                          <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-500 mt-2">After payment, upload proof below for verification.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upload Proof Section */}
                  {isPending && !hasProof && (
                    <div className="border-t dark:border-gray-700 pt-3.5 sm:pt-4">
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">Upload Payment Proof</label>
                      
                      {/* Drag & Drop Area */}
                      {!proofFiles[order.id] ? (
                        <div 
                          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 sm:p-6 text-center hover:border-orange-400 dark:hover:border-orange-500 transition cursor-pointer"
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, order.id)}
                          onClick={() => document.getElementById(`file-${order.id}`)?.click()}
                        >
                          <Upload size={24} className="text-gray-400 dark:text-gray-500 mx-auto mb-1 sm:mb-2 sm:w-8 sm:h-8" />
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Drag & drop your receipt here, or click to browse</p>
                          <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG up to 5MB</p>
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
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 sm:p-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            {proofPreviews[order.id] ? (
                              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden relative">
                                <Image 
                                  src={proofPreviews[order.id]} 
                                  alt="Preview" 
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                                <ImageIcon size={20} className="text-gray-400 sm:w-6 sm:h-6" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{proofFiles[order.id]?.name}</p>
                              <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">{formatFileSize(proofFiles[order.id]?.size || 0)}</p>
                            </div>
                            <button onClick={() => removeFile(order.id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded">
                              <X size={14} className="sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      <textarea
                        placeholder="Optional note (e.g., transaction reference)"
                        value={notes[order.id] || ''}
                        onChange={(e) => setNotes(prev => ({ ...prev, [order.id]: e.target.value }))}
                        rows={2}
                        className="w-full mt-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />

                      {messages[order.id] && (
                        <div className={`mt-2 p-2.5 sm:p-3 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 ${messages[order.id].type === 'success' ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'}`}>
                          {messages[order.id].type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                          {messages[order.id].text}
                        </div>
                      )}

                      <button
                        onClick={() => uploadProof(order.id)}
                        disabled={uploading === order.id || !proofFiles[order.id]}
                        className="w-full mt-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2.5 sm:py-3 rounded-xl font-medium text-sm hover:from-orange-600 hover:to-orange-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5 sm:gap-2"
                      >
                        {uploading === order.id ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                        {uploading === order.id ? 'Submitting...' : 'Submit Payment Proof'}
                      </button>
                    </div>
                  )}

                  {/* Existing Proof */}
                  {hasProof && (
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3.5 sm:p-4 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <CheckCircle size={14} className="text-green-600 dark:text-green-400" />
                        <p className="font-medium text-green-800 dark:text-green-400 text-sm sm:text-base">Payment Proof Submitted</p>
                      </div>
                      <button
                        onClick={() => window.open(order.proof_of_payment_url, '_blank')}
                        className="text-orange-600 dark:text-orange-400 hover:text-orange-700 text-xs sm:text-sm underline flex items-center gap-1"
                      >
                        <Eye size={12} /> View uploaded proof
                      </button>
                      {order.payment_note && <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-500 mt-2">Note: {order.payment_note}</p>}
                    </div>
                  )}

                  {/* Tracking Timeline */}
                  <div className="border-t dark:border-gray-700 pt-3.5 sm:pt-4">
                    <p className="font-semibold text-xs sm:text-sm mb-3 sm:mb-4 text-gray-800 dark:text-gray-200">Order Progress</p>
                    <div className="space-y-2.5 sm:space-y-3">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500" />
                        <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Order placed</p>
                        <span className="text-[9px] sm:text-xs text-gray-400 dark:text-gray-500 ml-auto">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${hasProof ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Payment proof submitted</p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${order.status === 'approved' ? 'bg-green-500' : order.status === 'declined' ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                        <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                          {order.status === 'approved' ? 'Payment approved' : order.status === 'declined' ? 'Payment rejected' : 'Awaiting admin approval'}
                        </p>
                      </div>
                      {(order.status === 'shipped' || order.status === 'delivered') && (
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500" />
                          <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">
                            {order.status === 'shipped' ? 'Order shipped' : 'Order delivered'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Method Footer */}
                  {order.payment_method && (
                    <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 border-t dark:border-gray-700 pt-3 flex items-center gap-1">
                      <CreditCard size={10} /> Payment: {order.payment_method}
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
