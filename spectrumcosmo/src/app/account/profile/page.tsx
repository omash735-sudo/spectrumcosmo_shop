'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/storefront/Navbar'
import Footer from '@/components/storefront/Footer'
import { Loader2, Upload } from 'lucide-react'

type User = {
  id: string
  name: string
  email: string
  phone: string
  profileImage?: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    phone: '',
  })

  // LOAD USER
  const loadUser = async () => {
    setLoading(true)

    try {
      const res = await fetch('/api/auth/me')

      if (!res.ok) {
        window.location.href = '/login'
        return
      }

      const data = await res.json().catch(() => null)

      if (!data?.user) {
        window.location.href = '/login'
        return
      }

      setUser(data.user)

      setForm({
        name: data.user?.name || '',
        phone: data.user?.phone || '',
      })
    } catch (err) {
      console.error('Failed to load user:', err)
      window.location.href = '/login'
    }

    setLoading(false)
  }

  useEffect(() => {
    loadUser()
  }, [])

  // UPDATE PROFILE
  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      await loadUser()
    } catch (err) {
      console.error('Update failed:', err)
    }

    setSaving(false)
  }

  // UPLOAD PROFILE IMAGE (CLOUDINARY)
  const uploadImage = async (file: File) => {
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'spectrumcosmo')

      const res = await fetch(
        'https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      )

      const data = await res.json()

      if (!data?.secure_url) {
        alert('Image upload failed')
        setUploading(false)
        return
      }

      await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImage: data.secure_url }),
      })

      await loadUser()
    } catch (err) {
      console.error('Upload error:', err)
    }

    setUploading(false)
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-gray-600" />
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

          {/* PROFILE CARD */}
          <section className="bg-white rounded-2xl border p-6">

            <div className="flex items-center gap-4 mb-6">

              {/* PROFILE IMAGE */}
              <div className="relative">
                <img
                  src={
                    user?.profileImage ||
                    'https://via.placeholder.com/100'
                  }
                  className="w-20 h-20 rounded-full object-cover border"
                />

                <label className="absolute bottom-0 right-0 bg-black text-white p-1 rounded-full cursor-pointer">
                  <Upload size={14} />

                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadImage(file)
                    }}
                  />
                </label>

                {uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                    <Loader2 className="animate-spin text-white" />
                  </div>
                )}
              </div>

              {/* USER INFO */}
              <div>
                <h2 className="text-xl font-bold">My Profile</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>

            </div>

            {/* FORM */}
            <form onSubmit={updateProfile} className="space-y-4">

              <div>
                <label className="text-sm text-gray-600">Name</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600">Phone</label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                />
              </div>

              <button
                className="btn-primary w-full"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>

            </form>
          </section>

        </div>
      </main>

      <Footer />
    </>
  )
}
