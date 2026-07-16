'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  Loader2, Upload, User, Mail, Phone, Sparkles, 
  CheckCircle, ArrowLeft, Camera, Save, X,
  MapPin, Lock, Trash2, ChevronRight, AlertCircle,
  Eye, EyeOff, Home, Building, Map, KeyRound
} from 'lucide-react'
import toast from 'react-hot-toast'

type User = {
  id: string
  name: string
  email: string
  phone: string
  profileImage?: string
}

type Address = {
  id: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '' })

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Delete Account Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const DELETE_CONFIRM_TEXT = 'DELETE'

  const loadUser = async () => {
    setLoading(true)
    try {
      const [userRes, addressesRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/account/addresses')
      ])
      
      if (!userRes.ok) throw new Error('Not authenticated')
      const userData = await userRes.json()
      if (!userData?.user) throw new Error('No user data')
      setUser(userData.user)
      setForm({ name: userData.user.name || '', phone: userData.user.phone || '' })

      if (addressesRes.ok) {
        const addressesData = await addressesRes.json()
        setAddresses(Array.isArray(addressesData) ? addressesData : [])
      }
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
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setUploading(true)
    
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dfsvnaslv'
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'spectrumcosmo_unsigned_upload'
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)

    try {
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }
    
    setChangingPassword(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const data = await res.json()
      if (res.ok) {
        setPasswordSuccess('Password changed successfully')
        toast.success('Password changed successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setShowPasswordModal(false), 1500)
      } else {
        setPasswordError(data.error || 'Failed to change password')
      }
    } catch (err) {
      setPasswordError('Something went wrong')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== DELETE_CONFIRM_TEXT) {
      toast.error(`Please type ${DELETE_CONFIRM_TEXT} to confirm`)
      return
    }
    setDeleting(true)
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'DELETE' })
      if (res.ok) {
        toast.success('Account deleted successfully')
        router.push('/')
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to delete account')
      }
    } catch (err) {
      toast.error('Something went wrong')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 border-3 border-[var(--border)] border-t-[var(--primary)] rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
          <p className="text-[var(--foreground-muted)] text-sm sm:text-base">Loading your profile...</p>
        </div>
      </div>
    )
  }

  const defaultAddress = addresses.find(a => a.is_default)
  const displayAddresses = addresses.slice(0, 2)
  const hasMoreAddresses = addresses.length > 2

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
      
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/account" className="p-1.5 sm:p-2 hover:bg-[var(--background-secondary)] rounded-full transition">
            <ArrowLeft size={16} className="text-[var(--foreground-muted)] sm:w-5 sm:h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1 h-5 sm:h-6 bg-[var(--primary)] rounded-full"></div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--foreground)]">My Profile</h1>
              <Sparkles size={14} className="text-[var(--primary)] sm:w-[18px] sm:h-[18px]" />
            </div>
            <p className="text-[var(--foreground-muted)] text-xs sm:text-sm mt-0.5 sm:mt-1">Manage your personal information</p>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-[var(--background-card)] rounded-xl sm:rounded-2xl shadow-lg border border-[var(--border)] overflow-hidden">
        
        {/* Avatar Section - With Manga Panel */}
        <div className="manga-bg cards-manga relative">
          <div className="relative z-10 bg-[var(--background-secondary)] px-4 sm:px-6 py-5 sm:py-6 md:py-8 border-b border-[var(--border)]">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="relative group">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-[var(--background-secondary)] ring-4 ring-[var(--background-card)] shadow-md">
                  {user?.profileImage ? (
                    <Image 
                      src={user.profileImage} 
                      alt={user.name || 'Profile'} 
                      width={112} 
                      height={112} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[var(--primary)]/20">
                      <User size={40} className="text-[var(--primary)] sm:w-12 sm:h-12" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-[var(--primary)] text-white p-1.5 sm:p-2 rounded-full cursor-pointer shadow-md hover:bg-[var(--primary-hover)] transition-all duration-200 hover:scale-105">
                  <Camera size={12} className="sm:w-3.5 sm:h-3.5" />
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
                    <Loader2 className="animate-spin text-white w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                )}
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">{user?.name || 'User'}</h2>
                <div className="flex items-center justify-center sm:justify-start gap-1 text-[var(--foreground-muted)] text-xs sm:text-sm mt-1">
                  <Mail size={12} className="sm:w-3.5 sm:h-3.5" />
                  <span className="break-all">{user?.email}</span>
                </div>
                {user?.phone && (
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-[var(--foreground-muted)] text-xs sm:text-sm mt-0.5">
                    <Phone size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={updateProfile} className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1 sm:mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <input
                  type="text"
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all outline-none"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1 sm:mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <input
                  type="tel"
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all outline-none"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Add your phone number"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 sm:pt-4 border-t border-[var(--border)]">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-5 sm:px-8 py-2.5 sm:py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 shadow-sm text-sm sm:text-base"
            >
              {saving ? <Loader2 className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Save size={16} className="sm:w-[18px] sm:h-[18px]" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Addresses Section */}
      <div className="mt-6 sm:mt-8">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <MapPin size={16} className="text-[var(--primary)] sm:w-[18px] sm:h-[18px]" />
            <h2 className="text-base sm:text-lg font-semibold text-[var(--foreground)]">Saved Addresses</h2>
            <span className="text-xs text-[var(--foreground-muted)] bg-[var(--background-secondary)] px-2 py-0.5 rounded-full">
              {addresses.length}
            </span>
          </div>
          <Link 
            href="/account/addresses" 
            className="text-xs sm:text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium flex items-center gap-1"
          >
            Manage <ChevronRight size={14} />
          </Link>
        </div>

        {addresses.length === 0 ? (
          <div className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-6 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[var(--background-secondary)] rounded-full flex items-center justify-center mx-auto mb-3">
              <MapPin size={20} className="text-[var(--foreground-muted)] sm:w-6 sm:h-6" />
            </div>
            <p className="text-[var(--foreground-muted)] text-sm">No saved addresses</p>
            <p className="text-[var(--foreground-muted)] text-xs mt-1 opacity-70">Add your first address for faster checkout</p>
            <Link 
              href="/account/addresses" 
              className="inline-block mt-3 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium"
            >
              Add Address →
            </Link>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {displayAddresses.map((address) => (
              <div 
                key={address.id} 
                className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-5 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {address.is_default ? (
                        <Home size={14} className="text-[var(--primary)] flex-shrink-0" />
                      ) : (
                        <Map size={14} className="text-[var(--foreground-muted)] flex-shrink-0" />
                      )}
                      <span className="font-medium text-sm text-[var(--foreground)] truncate">
                        {address.address_line1}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--foreground-muted)] mt-1">
                      {address.city}, {address.state} {address.postal_code}
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)]">{address.country}</p>
                    {address.is_default && (
                      <span className="inline-block mt-1.5 text-[10px] bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-full font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  <Link 
                    href={`/account/addresses`}
                    className="p-1.5 hover:bg-[var(--background-secondary)] rounded-lg transition flex-shrink-0"
                  >
                    <ChevronRight size={16} className="text-[var(--foreground-muted)]" />
                  </Link>
                </div>
              </div>
            ))}
            
            {hasMoreAddresses && (
              <Link 
                href="/account/addresses"
                className="block text-center text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium py-2"
              >
                + {addresses.length - 2} more address{addresses.length - 2 !== 1 ? 'es' : ''}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 sm:mt-8 grid grid-cols-2 gap-3 sm:gap-4">
        <button
          onClick={() => setShowPasswordModal(true)}
          className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-5 flex items-center gap-3 hover:shadow-md hover:border-[var(--primary)]/30 transition group"
        >
          <div className="p-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
            <Lock size={16} />
          </div>
          <div className="text-left">
            <p className="font-medium text-sm text-[var(--foreground)]">Change Password</p>
            <p className="text-xs text-[var(--foreground-muted)]">Update your security</p>
          </div>
          <ChevronRight size={14} className="ml-auto text-[var(--foreground-muted)] group-hover:translate-x-1 transition" />
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="bg-[var(--background-card)] rounded-xl border border-[var(--border)] p-4 sm:p-5 flex items-center gap-3 hover:shadow-md hover:border-red-300 transition group"
        >
          <div className="p-2 rounded-lg bg-red-50 text-red-500">
            <Trash2 size={16} />
          </div>
          <div className="text-left">
            <p className="font-medium text-sm text-red-600">Delete Account</p>
            <p className="text-xs text-[var(--foreground-muted)]">Permanently delete</p>
          </div>
          <ChevronRight size={14} className="ml-auto text-[var(--foreground-muted)] group-hover:text-red-500 transition" />
        </button>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-[var(--background-card)] rounded-xl sm:rounded-2xl max-w-md w-full shadow-xl border border-[var(--border)] mx-2 sm:mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 sm:p-4 md:p-6 border-b border-[var(--border)]">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-[var(--foreground)]">Change Password</h3>
                  <p className="text-[10px] sm:text-xs md:text-sm text-[var(--foreground-muted)] mt-0.5">Create a strong password for your account</p>
                </div>
                <button onClick={() => setShowPasswordModal(false)} className="p-1.5 sm:p-2 hover:bg-[var(--background-secondary)] rounded-lg transition min-h-[32px] min-w-[32px] flex items-center justify-center">
                  <X size={16} className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5 text-[var(--foreground-muted)]" />
                </button>
              </div>
            </div>
            <form onSubmit={handleChangePassword} className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">Current Password</label>
                <div className="relative">
                  <Lock size={14} className="sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-8 sm:pl-9 pr-10 sm:pr-12 py-2 text-xs sm:text-sm border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] min-h-[44px]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition"
                  >
                    {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">New Password</label>
                <div className="relative">
                  <KeyRound size={14} className="sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-8 sm:pl-9 pr-10 sm:pr-12 py-2 text-xs sm:text-sm border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] min-h-[44px]"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition"
                  >
                    {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-[var(--foreground-muted)] mt-1">Minimum 8 characters</p>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--foreground)] mb-1">Confirm New Password</label>
                <div className="relative">
                  <KeyRound size={14} className="sm:w-4 sm:h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-8 sm:pl-9 pr-3 py-2 text-xs sm:text-sm border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] min-h-[44px]"
                    required
                  />
                </div>
              </div>
              {passwordError && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-2 sm:p-2.5 flex items-center gap-1.5 sm:gap-2">
                  <AlertCircle size={12} className="sm:w-3.5 sm:h-3.5 text-red-500" />
                  <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-400">{passwordError}</p>
                </div>
              )}
              {passwordSuccess && (
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-2 sm:p-2.5 flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle size={12} className="sm:w-3.5 sm:h-3.5 text-green-500" />
                  <p className="text-[10px] sm:text-xs text-green-600 dark:text-green-400">{passwordSuccess}</p>
                </div>
              )}
              <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm border border-[var(--border)] rounded-lg text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition min-h-[44px]">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white py-2 sm:py-2.5 rounded-lg font-medium transition disabled:opacity-50 text-xs sm:text-sm min-h-[44px]"
                >
                  {changingPassword ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-[var(--background-card)] rounded-xl sm:rounded-2xl max-w-md w-full shadow-xl border border-[var(--border)] mx-2 sm:mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 sm:p-4 md:p-6 border-b bg-red-50 dark:bg-red-950/30 rounded-t-xl sm:rounded-t-2xl border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-red-600 dark:text-red-400" />
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-red-600 dark:text-red-400">Delete Account</h3>
              </div>
              <p className="text-[10px] sm:text-xs md:text-sm text-red-500 dark:text-red-500 mt-0.5">This action cannot be undone</p>
            </div>
            <div className="p-3 sm:p-4 md:p-6">
              <p className="text-xs sm:text-sm md:text-base text-[var(--foreground-muted)] mb-3 sm:mb-4">
                All your data, orders, wishlist, and profile information will be permanently deleted.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4">
                <p className="text-[10px] sm:text-xs md:text-sm text-yellow-800 dark:text-yellow-400 flex items-center gap-1.5 sm:gap-2">
                  <AlertCircle size={12} className="sm:w-3.5 sm:h-3.5" />
                  Type <code className="font-mono bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold">DELETE</code> to confirm
                </p>
              </div>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] rounded-lg px-3 py-2 sm:px-4 sm:py-3 mb-3 sm:mb-4 text-xs sm:text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[44px]"
                placeholder="Type DELETE here"
              />
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button 
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }} 
                  className="flex-1 px-3 py-2 sm:px-4 sm:py-2.5 border border-[var(--border)] rounded-lg text-xs sm:text-sm text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== DELETE_CONFIRM_TEXT || deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 sm:py-2.5 rounded-lg font-medium transition disabled:opacity-50 text-xs sm:text-sm min-h-[44px]"
                >
                  {deleting ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Permanently Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
