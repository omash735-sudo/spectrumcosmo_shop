'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2, Upload, X } from 'lucide-react'
import StarRating from '@/components/ui/StarRating'
import Image from 'next/image'

export default function ReviewSubmitForm({ productId }: { productId?: string }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loadingUser, setLoadingUser] = useState(true)

  const [form, setForm] = useState({
    review_text: '',
    rating: 0,
    image_url: '',
    product_id: productId || '',
  })
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  // Check authentication
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) {
          router.push('/login?redirect=/reviews/submit')
          return
        }
        const data = await res.json()
        setUser(data.user)
      } catch (err) {
        router.push('/login')
      } finally {
        setLoadingUser(false)
      }
    }
    fetchUser()
  }, [router])

  // Cloudinary upload (same as profile picture)
  const uploadImage = async (file: File) => {
    setUploading(true)
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'YOUR_CLOUD_NAME'
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'spectrumcosmo'
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!data.secure_url) throw new Error('Upload failed')
      setForm(prev => ({ ...prev, image_url: data.secure_url }))
    } catch (err) {
      console.error(err)
      alert('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.rating === 0) {
      setError('Please select a star rating.')
      return
    }
    setStatus('loading')
    setError('')

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_text: form.review_text,
          rating: form.rating,
          image_url: form.image_url || null,
          product_id: form.product_id || null,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Submission failed')
      }

      setStatus('success')
    } catch (err: any) {
      setError(err.message)
      setStatus('error')
    }
  }

  if (loadingUser) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    )
  }

  if (!user) return null // already redirecting

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center text-center py-8 gap-4">
        <CheckCircle className="text-green-500" size={56} />
        <h2 className="font-bold text-gray-800 text-2xl">Thank You!</h2>
        <p className="text-gray-500 max-w-sm">
          Your review has been submitted and is pending approval. You can check its status in the "My Reviews" tab.
        </p>
        <a href="/reviews" className="mt-2 bg-orange-500 text-white px-6 py-2 rounded-full hover:bg-orange-600">
          Back to Reviews
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
        <input
          type="text"
          value={user.name}
          disabled
          className="w-full bg-gray-100 border rounded-xl px-3 py-2 text-gray-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Rating *</label>
        <div className="mt-1">
          <StarRating
            rating={form.rating}
            interactive
            onRate={r => setForm(prev => ({ ...prev, rating: r }))}
            size={28}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Review *</label>
        <textarea
          value={form.review_text}
          onChange={e => setForm(prev => ({ ...prev, review_text: e.target.value }))}
          required
          rows={4}
          placeholder="Tell us about your experience..."
          className="w-full border rounded-xl px-3 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Upload Photo (optional)</label>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 transition">
            <Upload size={16} />
            Choose file
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadImage(file)
              }}
            />
          </label>
          {uploading && <Loader2 className="animate-spin text-orange-500" size={20} />}
          {form.image_url && (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden border">
              <Image src={form.image_url} alt="Preview" fill className="object-cover" />
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                className="absolute top-0 right-0 bg-black/50 rounded-bl-lg p-0.5"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-orange-500 text-white py-2.5 rounded-xl font-medium hover:bg-orange-600 disabled:opacity-50 transition"
      >
        {status === 'loading' ? (
          <><Loader2 size={16} className="animate-spin inline mr-2" /> Submitting...</>
        ) : (
          'Submit Review'
        )}
      </button>
    </form>
  )
}
