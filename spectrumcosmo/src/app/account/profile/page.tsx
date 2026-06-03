'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Loader2, Upload, User, Mail, Phone, Sparkles, 
  CheckCircle, ArrowLeft, Camera, Save, X
} from 'lucide-react'
import toast from 'react-hot-toast'

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
  const [form, setForm] = useState({ name: '', phone: '' })

  const loadUser = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) throw new Error('Not authenticated')
      const data = await res.json()
      if (!data?.user) throw new Error('No user data')
      setUser(data.user)
      setForm({ name: data.user.name || '', phone: data.user.phone || '' })
    } catch (err) {
      console.error('Failed to load user:', err)
      window.location.href = '/login'
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadUser() }, [])

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Update failed')
      await loadUser()
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const uploadImage = async (file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setUploading(true)
    
    // Use fallback values like the old working version
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dfsvnaslv'
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'spectrumcosmo_unsigned_upload'
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)

    try {
      // Upload to Cloudinary
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error?.message || 'Upload failed')
      }
      
      if (!data?.secure_url) {
        throw new Error('No secure_url in response')
      }

      // Save to your API
      const profileRes = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImage: data.secure_url }),
      })
      
      if (!profileRes.ok) {
        const errorData = await profileRes.json()
        throw new Error(errorData.error || 'Failed to save image')
      }

      await loadUser()
      toast.success('Profile picture updated!')
    } catch (err: any) {
      console.error('Upload error:', err)
      toast.error(err.message || 'Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <Link href="/account" className="p-2 hover:bg-gray-100 rounded-full transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-t from-orange-500 to-orange-600 rounded-full"></div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Profile</h1>
              <Sparkles size={18} className="text-orange-400" />
            </div>
            <p className="text-gray-500 text-sm mt-1">Manage your personal information</p>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Avatar Section */}
        <div className="relative bg-gradient-to-r from-orange-50 to-white px-6 py-8 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 ring-4 ring-white shadow-md">
                {user?.profileImage ? (
                  <Image 
                    src={user.profileImage} 
                    alt={user.name || 'Profile'} 
                    width={112} 
                    height={112} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200">
                    <User size={48} className="text-orange-400" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-1 right-1 bg-orange-500 text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-orange-600 transition-all duration-200 hover:scale-105">
                <Camera size={14} />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/jpeg,image/png,image/webp" 
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) uploadImage(file)
                  }} 
                />
              </label>
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Loader2 className="animate-spin text-white w-6 h-6" />
                </div>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-gray-900">{user?.name || 'User'}</h2>
              <div className="flex items-center justify-center sm:justify-start gap-1 text-gray-500 text-sm mt-1">
                <Mail size={14} />
                <span>{user?.email}</span>
              </div>
              {user?.phone && (
                <div className="flex items-center justify-center sm:justify-start gap-1 text-gray-500 text-sm mt-0.5">
                  <Phone size={14} />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={updateProfile} className="p-6 space-y-6">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="tel"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Add your phone number"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
