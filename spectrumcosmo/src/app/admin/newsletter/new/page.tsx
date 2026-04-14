'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewNewsletterPage() {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [audience, setAudience] = useState('all')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)

    await fetch('/api/newsletter/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content,
        image_url: imageUrl,
        audience,
        status: 'draft'
      }),
    })

    setLoading(false)
    router.push('/admin/newsletter')
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-gray-100">

      <h1 className="text-xl font-bold mb-6">Create Newsletter</h1>

      <input
        className="w-full border p-2 mb-3 rounded"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="w-full border p-2 mb-3 rounded"
        placeholder="Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <input
        className="w-full border p-2 mb-3 rounded"
        placeholder="Image URL"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />

      <select
        className="w-full border p-2 mb-3 rounded"
        value={audience}
        onChange={(e) => setAudience(e.target.value)}
      >
        <option value="all">All Subscribers</option>
        <option value="customers">Customers Only</option>
      </select>

      <button
        onClick={handleCreate}
        disabled={loading}
        className="bg-[#F97316] text-white px-4 py-2 rounded"
      >
        {loading ? 'Creating...' : 'Create Newsletter'}
      </button>

    </div>
  )
}
